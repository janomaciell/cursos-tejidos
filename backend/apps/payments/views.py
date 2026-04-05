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
from .email_service import send_payment_confirmation
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_courses(request):
    """Lista de cursos comprados por el usuario (Mis Cursos)."""
    accesses = CourseAccess.objects.filter(
        user=request.user,
        is_active=True
    ).select_related('course').order_by('-purchased_at')
    serializer = CourseAccessSerializer(accesses, many=True)
    return Response(serializer.data)


def get_frontend_url():
    """Obtener la URL base del frontend."""
    url = getattr(settings, 'FRONTEND_URL', None)
    if url and url.strip():
        return url.strip().rstrip('/')
    return 'http://localhost:5173'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """Crear preferencia de pago en Mercado Pago.

    Acepta:
      - { "course_id": 5 }            -> pago individual
      - { "course_ids": [5, 8, 12] }  -> carrito (múltiples cursos)
    """
    serializer = CreatePaymentSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    course_ids = serializer.validated_data['course_ids']
    user = request.user

    # ------------------------------------------------------------------
    # Validar todos los cursos y filtrar los que el usuario ya tiene
    # ------------------------------------------------------------------
    courses = []
    already_owned = []
    not_found = []

    for cid in course_ids:
        try:
            course = Course.objects.get(id=cid, is_active=True)
        except Course.DoesNotExist:
            not_found.append(cid)
            continue

        if CourseAccess.objects.filter(user=user, course=course, is_active=True).exists():
            already_owned.append(course.title)
        else:
            courses.append(course)

    if not_found:
        return Response(
            {'error': f'Cursos no encontrados: {not_found}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not courses:
        # All courses already owned
        return Response(
            {'error': f'Ya tenés acceso a todos los cursos seleccionados: {already_owned}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        mp_service = MercadoPagoService()
        frontend_url = get_frontend_url()

        # Back-URL: if single course go to course page, else go to mis-cursos
        if len(courses) == 1:
            return_url = f"{frontend_url}/cursos/{courses[0].slug}"
        else:
            return_url = f"{frontend_url}/mis-cursos"

        backend_url = (getattr(settings, 'BACKEND_URL', None) or '').strip()
        if backend_url:
            notification_url = f"{backend_url.rstrip('/')}/api/payments/webhook/"
        else:
            notification_url = request.build_absolute_uri('/api/payments/webhook/')

        logger.info(f"[MP] Creating cart payment for {len(courses)} course(s): {[c.title for c in courses]}")
        logger.info(f"[MP] return_url: {return_url}")
        logger.info(f"[MP] notification_url: {notification_url}")

        # Single MP preference for all courses in cart
        preference = mp_service.create_cart_preference(
            courses=courses,
            user=user,
            return_url=return_url,
            notification_url=notification_url
        )

        # Create one pending Transaction per course (same preference_id)
        transactions = []
        for course in courses:
            t = Transaction.objects.create(
                user=user,
                course=course,
                mp_preference_id=preference['preference_id'],
                amount=course.price,
                status='pending',
                ip_address=get_client_ip(request)
            )
            transactions.append(t)

        init_point = preference.get('init_point', '')
        sandbox_init_point = (preference.get('sandbox_init_point') or '').strip() or init_point

        logger.info(f"[MP] Created {len(transactions)} transaction(s) - preference: {preference['preference_id']}")

        return Response({
            'preference_id': preference['preference_id'],
            'init_point': init_point,
            'sandbox_init_point': sandbox_init_point,
            'transaction_ids': [t.id for t in transactions],
            'courses_count': len(courses),
            'already_owned': already_owned,  # info for frontend notification
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
        transaction = Transaction.objects.filter(
            mp_payment_id=payment_id,
            user=request.user
        ).first()
        if not transaction:
            return Response(
                {'error': 'Transacción no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_preference_status(request, preference_id):
    """Consultar estado de pago por preference_id (polling).
    
    Para carrito: hay varias transacciones con el mismo preference_id.
    Solo necesitamos devolver el estado de una para el polling.
    """
    try:
        # Get the first pending transaction for this preference (cart may have many)
        transaction = Transaction.objects.filter(
            mp_preference_id=preference_id,
            user=request.user
        ).order_by('-created_at').first()

        if not transaction:
            logger.warning(f"[Polling] Transaction not found: {preference_id}")
            return Response(
                {'error': 'Transacción no encontrada', 'status': 'not_found'},
                status=status.HTTP_404_NOT_FOUND
            )

        logger.info(f"[Polling] Checking preference: {preference_id}")
        mp_service = MercadoPagoService()

        try:
            if transaction.mp_payment_id:
                logger.info(f"[Polling] Consulting payment_id: {transaction.mp_payment_id}")
                payment_info = mp_service.get_payment_info(transaction.mp_payment_id)
                mp_status = payment_info.get('status')
                new_status = map_mp_status(mp_status)

                logger.info(f"[Polling] Payment status: MP={mp_status}, internal={new_status}")

                old_status = transaction.status
                transaction.status = new_status
                transaction.payment_method = payment_info.get('payment_method_id', '')
                transaction.payment_type = payment_info.get('payment_type_id', '')

                if new_status == 'approved' and old_status != 'approved':
                    # Approve ALL transactions for this preference
                    _approve_all_cart_transactions(preference_id, user=request.user,
                                                   payment_info=payment_info,
                                                   mp_service=mp_service,
                                                   payment_id=transaction.mp_payment_id)
                    logger.info(f"[Polling] ✓ Payment {transaction.mp_payment_id} APPROVED!")
                else:
                    transaction.save()

            else:
                # Search by external_reference (cart uses a combined one)
                external_reference = _build_cart_external_reference(
                    user=request.user,
                    transactions=Transaction.objects.filter(
                        mp_preference_id=preference_id, user=request.user
                    )
                )
                logger.info(f"[Polling] Searching for payment: external_reference={external_reference}")
                payment_data = mp_service.search_payments_by_external_reference(external_reference)

                if payment_data:
                    pid = str(payment_data.get("id", ""))
                    mp_status = payment_data.get("status")
                    logger.info(f"[Polling] ✓ Payment FOUND: {pid}, status: {mp_status}")

                    new_status = map_mp_status(mp_status)
                    if new_status == 'approved':
                        _approve_all_cart_transactions(preference_id, user=request.user,
                                                       payment_info=payment_data,
                                                       mp_service=mp_service,
                                                       payment_id=pid)
                        logger.info(f"[Polling] ✓ Cart payment {pid} APPROVED!")
                    else:
                        # Update all transaction statuses
                        Transaction.objects.filter(
                            mp_preference_id=preference_id, user=request.user
                        ).update(status=new_status, mp_payment_id=pid)
                else:
                    logger.info(f"[Polling] No payment found yet")

        except Exception as e:
            logger.error(f"[Polling] Error querying MP: {str(e)}", exc_info=True)

        # Re-fetch to get updated status
        transaction.refresh_from_db()
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)

    except Exception as e:
        logger.error(f"[Polling] Unexpected error: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e), 'status': 'error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _approve_all_cart_transactions(preference_id, user, payment_info, mp_service, payment_id):
    """Approve all pending transactions for a given cart preference."""
    transactions = Transaction.objects.filter(
        mp_preference_id=preference_id,
        user=user,
        status='pending'
    )
    for t in transactions:
        t.mp_payment_id = payment_id
        t.payment_method = payment_info.get('payment_method_id', '')
        t.payment_type = payment_info.get('payment_type_id', '')
        t.approve()
        t.save()
        try:
            send_payment_confirmation(t, payment_info)
        except Exception as e:
            logger.error(f"[ApproveCart] Error sending email for tx {t.id}: {e}")


def _build_cart_external_reference(user, transactions):
    """Build the external_reference used when creating a cart preference."""
    course_ids = sorted([str(t.course_id) for t in transactions])
    return f"user_{user.id}_courses_{'_'.join(course_ids)}"


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