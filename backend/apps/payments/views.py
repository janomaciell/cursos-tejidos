from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import Transaction, CourseAccess
from .serializers import (
    TransactionSerializer,
    CourseAccessSerializer,
    CreatePaymentSerializer
)
from .mercadopago import MercadoPagoService
from apps.courses.models import Course
import logging

logger = logging.getLogger(__name__)


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para transacciones"""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')


class CourseAccessViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para accesos a cursos (Mis Cursos)"""
    serializer_class = CourseAccessSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CourseAccess.objects.filter(
            user=self.request.user,
            is_active=True
        ).select_related('course').order_by('-purchased_at')


def get_frontend_url():
    """Obtener la URL base del frontend.
    
    Lee FRONTEND_URL desde settings (viene de .env).
    En desarrollo: http://localhost:5173
    En producción: tu dominio real
    """
    url = getattr(settings, 'FRONTEND_URL', None)
    if url and url.strip():
        return url.strip().rstrip('/')
    # Fallback para desarrollo
    return 'http://localhost:5173'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """Crear preferencia de pago en Mercado Pago"""
    serializer = CreatePaymentSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    course_id = serializer.validated_data['course_id']
    course = get_object_or_404(Course, id=course_id, is_active=True)
    user = request.user
    
    # Verificar si ya tiene acceso
    if CourseAccess.objects.filter(user=user, course=course, is_active=True).exists():
        return Response(
            {'error': 'Ya tienes acceso a este curso'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        mp_service = MercadoPagoService()
        
        # URL del frontend donde redirigir después del pago
        frontend_url = get_frontend_url()
        return_url = f"{frontend_url}/cursos/{course.slug}"

        # URL del webhook donde MP notifica el resultado
        # Con ngrok, esta URL SÍ funcionará
        notification_url = request.build_absolute_uri('/api/payments/webhook/')

        # Debug: mostrar exactamente qué URLs se envían a MP
        logger.info(f"[MP] Creating payment for course: {course.title}")
        logger.info(f"[MP] frontend_url: {frontend_url}")
        logger.info(f"[MP] return_url: {return_url}")
        logger.info(f"[MP] notification_url: {notification_url}")
        
        preference = mp_service.create_preference(
            course=course,
            user=user,
            return_url=return_url,
            notification_url=notification_url
        )
        
        # Crear transacción pendiente
        transaction = Transaction.objects.create(
            user=user,
            course=course,
            mp_preference_id=preference['preference_id'],
            amount=course.price,
            status='pending',
            ip_address=get_client_ip(request)
        )
        
        init_point = preference.get('init_point', '')
        sandbox_url = preference.get('sandbox_init_point', '').strip()
        # Si la API no devuelve sandbox_init_point (p. ej. con cierto token de prueba), forzar URL sandbox
        if not sandbox_url and init_point and 'sandbox.' not in init_point:
            sandbox_url = init_point.replace('www.mercadopago', 'sandbox.mercadopago')
            logger.info(f"[MP] Forced sandbox URL (API did not return sandbox_init_point)")
        logger.info(f"[MP] Transaction created: {transaction.id} - preference: {preference['preference_id']}")
        logger.info(f"[MP] Checkout URL: sandbox={bool(sandbox_url)}")
        
        return Response({
            'preference_id': preference['preference_id'],
            'init_point': init_point,
            'sandbox_init_point': sandbox_url or init_point,
            'transaction_id': transaction.id
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"create_payment: error al crear pago: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Error al crear el pago: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, payment_id):
    """Verificar estado de un pago por payment_id"""
    try:
        transaction = Transaction.objects.get(
            mp_payment_id=payment_id,
            user=request.user
        )
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)
    except Transaction.DoesNotExist:
        return Response(
            {'error': 'Transacción no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_preference_status(request, preference_id):
    """Consultar manualmente el estado de un pago por preference_id.
    
    Este endpoint hace polling a MercadoPago para encontrar pagos asociados
    a una preferencia, útil cuando el webhook aún no llegó.
    """
    try:
        transaction = Transaction.objects.get(
            mp_preference_id=preference_id,
            user=request.user
        )
        
        logger.info(f"[Polling] Checking preference: {preference_id}")
        
        mp_service = MercadoPagoService()
        
        try:
            # Si ya tenemos payment_id, consultar directamente el estado
            if transaction.mp_payment_id:
                logger.info(f"[Polling] Consulting payment_id: {transaction.mp_payment_id}")
                payment_info = mp_service.get_payment_info(transaction.mp_payment_id)
                
                mp_status = payment_info.get('status')
                new_status = map_mp_status(mp_status)
                
                logger.info(f"[Polling] Payment status: MP={mp_status}, internal={new_status}")
                
                # Actualizar transacción
                old_status = transaction.status
                transaction.status = new_status
                transaction.payment_method = payment_info.get('payment_method_id', '')
                transaction.payment_type = payment_info.get('payment_type_id', '')
                
                # Si cambió a approved, dar acceso
                if new_status == 'approved' and old_status != 'approved':
                    transaction.approve()
                    logger.info(f"[Polling] ✓ Payment {transaction.mp_payment_id} APPROVED!")
                
                transaction.save()
                
            else:
                # No tenemos payment_id: buscar por external_reference.
                # La API de MP no admite búsqueda por preference_id (devuelve 400).
                external_reference = f"user_{transaction.user.id}_course_{transaction.course.id}"
                logger.info(f"[Polling] Searching for payment: external_reference={external_reference}")
                
                payment_data = mp_service.search_payments_by_external_reference(external_reference)
                
                # Solo usar el pago si no pertenece a otra transacción (otra preferencia).
                if payment_data:
                    pid = str(payment_data.get("id", ""))
                    other = Transaction.objects.filter(mp_payment_id=pid).first()
                    if other and other.mp_preference_id != preference_id:
                        logger.info(f"[Polling] Payment already linked to other preference, ignoring")
                        payment_data = None
                
                if payment_data:
                    # ¡Encontramos el pago de esta sesión!
                    payment_id = str(payment_data.get("id", ""))
                    mp_status = payment_data.get("status")
                    
                    logger.info(f"[Polling] ✓ Payment FOUND: {payment_id}, status: {mp_status}")
                    
                    # Evitar UNIQUE: si otro intento (misma preferencia/user/course) ya tiene este payment_id,
                    # no asignarlo aquí; usar la transacción que ya lo tiene para responder.
                    other = Transaction.objects.filter(mp_payment_id=payment_id).exclude(pk=transaction.pk).first()
                    if other:
                        logger.info(f"[Polling] Payment {payment_id} already linked to transaction {other.pk}, returning that one")
                        transaction = other
                        serializer = TransactionSerializer(transaction)
                        return Response(serializer.data)
                    
                    # Actualizar transacción
                    transaction.mp_payment_id = payment_id
                    transaction.status = map_mp_status(mp_status)
                    transaction.payment_method = payment_data.get("payment_method_id", "")
                    transaction.payment_type = payment_data.get("payment_type_id", "")
                    
                    # Si está aprobado, dar acceso
                    if transaction.status == "approved":
                        transaction.approve()
                        logger.info(f"[Polling] ✓ Payment {payment_id} APPROVED via polling!")
                    
                    transaction.save()
                else:
                    logger.info(f"[Polling] No payment found yet (user probably still filling form)")
        
        except Exception as e:
            logger.error(f"[Polling] Error querying MP: {str(e)}", exc_info=True)
            # No fallar, devolver el estado actual
        
        # Devolver la transacción actualizada
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)
        
    except Transaction.DoesNotExist:
        logger.warning(f"[Polling] Transaction not found: {preference_id}")
        return Response(
            {'error': 'Transacción no encontrada', 'status': 'not_found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"[Polling] Unexpected error: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e), 'status': 'error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def map_mp_status(mp_status):
    """Mapear estados de Mercado Pago a estados internos"""
    status_map = {
        "approved": "approved",
        "pending": "pending",
        "in_process": "pending",
        "rejected": "rejected",
        "cancelled": "cancelled",
        "refunded": "refunded",
    }
    return status_map.get(mp_status, "pending")


def get_client_ip(request):
    """Obtener IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip