import logging
from django.conf import settings
from django.db import models
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer
)

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Registro de nuevo usuario"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Usuario registrado exitosamente',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    
    # Log para depuración (ver en consola del backend qué falló)
    logging.getLogger(__name__).warning('Register validation errors: %s', serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login de usuario"""
    serializer = UserLoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login exitoso',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """Inicio de sesión o registro con Google (id_token)."""
    credential = request.data.get('credential')
    if not credential:
        return Response(
            {'message': 'Falta el token de Google.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '').strip()
    if not client_id:
        logging.getLogger(__name__).error('GOOGLE_CLIENT_ID no configurado')
        return Response(
            {'message': 'Login con Google no configurado.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            client_id
        )
        if idinfo['iss'] not in ('accounts.google.com', 'https://accounts.google.com'):
            return Response(
                {'message': 'Token de Google inválido.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        email = idinfo.get('email')
        if not email:
            return Response(
                {'message': 'Google no proporcionó email.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        name = idinfo.get('name') or ''
        parts = name.strip().split(None, 1)
        first_name = parts[0] if parts else ''
        last_name = parts[1] if len(parts) > 1 else ''
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name or email.split('@')[0],
                'last_name': last_name,
                'is_active': True,
            }
        )
        if created:
            user.set_unusable_password()
            user.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login con Google exitoso',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
    except ValueError as e:
        logging.getLogger(__name__).warning('Google token verification failed: %s', e)
        return Response(
            {'message': 'Token de Google inválido o expirado.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout de usuario"""
    try:
        refresh_token = request.data.get("refresh")
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logout exitoso'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Ver y actualizar perfil de usuario"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = UserProfileUpdateSerializer(
            self.get_object(), 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Perfil actualizado exitosamente',
                'user': UserSerializer(self.get_object()).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Cambiar contraseña"""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({
            'message': 'Contraseña cambiada exitosamente'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_stats(request):
    """Obtener estadísticas del usuario"""
    from apps.payments.models import CourseAccess, Transaction
    from apps.courses.models import LessonProgress
    
    user = request.user
    
    courses_purchased = CourseAccess.objects.filter(user=user, is_active=True).count()
    total_spent = Transaction.objects.filter(
        user=user, 
        status='approved'
    ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    lessons_completed = LessonProgress.objects.filter(
        user=user, 
        completed=True
    ).count()
    
    return Response({
        'courses_purchased': courses_purchased,
        'total_spent': float(total_spent),
        'lessons_completed': lessons_completed
    })