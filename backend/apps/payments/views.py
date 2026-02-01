from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, permission_classes, action
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
        # Crear preferencia en Mercado Pago
        mp_service = MercadoPagoService()
        
        frontend_url = settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else 'http://localhost:5173'
        return_url = f"{frontend_url}/payment-result"
        notification_url = f"{request.build_absolute_uri('/api/payments/webhook/')}"
        
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
        
        return Response({
            'preference_id': preference['preference_id'],
            'init_point': preference['init_point'],
            'sandbox_init_point': preference.get('sandbox_init_point', ''),
            'transaction_id': transaction.id
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': f'Error al crear el pago: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, payment_id):
    """Verificar estado de un pago"""
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


def get_client_ip(request):
    """Obtener IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip