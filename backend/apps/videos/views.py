from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from apps.courses.models import Lesson
from apps.payments.models import CourseAccess
from .models import VideoToken
from .cloudflare import CloudflareStreamService

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_video_token(request, lesson_id):
    """Generar token de acceso para un video"""
    lesson = get_object_or_404(Lesson, id=lesson_id)
    user = request.user
    
    # Verificar si es preview o tiene acceso
    if not lesson.is_preview:
        has_access = CourseAccess.objects.filter(
            user=user,
            course=lesson.module.course,
            is_active=True
        ).exists()
        
        if not has_access:
            return Response(
                {'error': 'No tienes acceso a este video'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    try:
        # Generar token con Cloudflare
        cf_service = CloudflareStreamService()
        video_url = cf_service.get_video_url(lesson.video_id, signed=True)
        
        # Guardar token en BD para referencia
        expires_at = timezone.now() + timedelta(hours=2)
        video_token = VideoToken.objects.create(
            lesson=lesson,
            token=video_url.split('token=')[-1] if 'token=' in video_url else '',
            expires_at=expires_at
        )
        
        return Response({
            'video_url': video_url,
            'expires_at': expires_at,
            'lesson_title': lesson.title
        })
    
    except Exception as e:
        return Response(
            {'error': f'Error al generar token: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_video_info(request, lesson_id):
    """Obtener información del video"""
    lesson = get_object_or_404(Lesson, id=lesson_id)
    user = request.user
    
    # Verificar acceso
    if not lesson.is_preview:
        has_access = CourseAccess.objects.filter(
            user=user,
            course=lesson.module.course,
            is_active=True
        ).exists()
        
        if not has_access:
            return Response(
                {'error': 'No tienes acceso a este video'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    try:
        cf_service = CloudflareStreamService()
        video_info = cf_service.get_video_info(lesson.video_id)
        
        return Response({
            'video_id': lesson.video_id,
            'title': lesson.title,
            'duration': video_info.get('duration', lesson.duration_minutes * 60),
            'thumbnail': video_info.get('thumbnail', ''),
            'status': video_info.get('status', {}).get('state', 'unknown')
        })
    
    except Exception as e:
        return Response(
            {'error': f'Error al obtener info del video: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )