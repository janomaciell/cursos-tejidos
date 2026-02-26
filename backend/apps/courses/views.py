from rest_framework import viewsets, status, generics, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import Course, Module, Lesson, LessonProgress, LessonDocument
from .serializers import (
    CourseListSerializer,
    CourseDetailSerializer,
    LessonProgressSerializer,
    ModuleSerializer,
    LessonDetailSerializer,
    LessonDocumentSerializer,
)
from .filters import CourseFilter
from apps.payments.models import CourseAccess


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para cursos - Lista y detalle"""
    queryset = Course.objects.filter(is_active=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CourseFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'price', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseListSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'featured']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_object_by_slug(self, slug):
        """Obtener curso por slug (para uso en retrieve por slug)."""
        return get_object_or_404(self.get_queryset(), slug=slug)

    def retrieve(self, request, *args, **kwargs):
        """Soporta retrieve por pk o por slug."""
        lookup = kwargs.get('pk')
        if lookup and not str(lookup).isdigit():
            # Es un slug, no un pk
            instance = self.get_object_by_slug(lookup)
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Obtener cursos destacados"""
        featured_courses = self.queryset.filter(is_featured=True)[:6]
        serializer = self.get_serializer(featured_courses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def check_access(self, request, pk=None):
        """Verificar si el usuario tiene acceso al curso"""
        course = self.get_object()
        has_access = CourseAccess.objects.filter(
            user=request.user,
            course=course,
            is_active=True
        ).exists()
        return Response({'has_access': has_access})
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def modules(self, request, pk=None):
        """Obtener módulos de un curso con acceso"""
        course = self.get_object()
        
        # Verificar acceso
        has_access = CourseAccess.objects.filter(
            user=request.user,
            course=course,
            is_active=True
        ).exists()
        
        if not has_access:
            return Response(
                {'error': 'No tienes acceso a este curso'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        modules = course.modules.all()
        serializer = ModuleSerializer(modules, many=True)
        return Response(serializer.data)


class LessonProgressViewSet(viewsets.ModelViewSet):
    """ViewSet para progreso de lecciones"""
    serializer_class = LessonProgressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return LessonProgress.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        lesson_id = request.data.get('lesson')
        lesson = get_object_or_404(Lesson, id=lesson_id)
        
        # Verificar acceso al curso
        has_access = CourseAccess.objects.filter(
            user=request.user,
            course=lesson.module.course,
            is_active=True
        ).exists()
        
        if not has_access:
            return Response(
                {'error': 'No tienes acceso a este curso'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Crear o actualizar progreso
        progress, created = LessonProgress.objects.update_or_create(
            user=request.user,
            lesson=lesson,
            defaults={
                'progress_percentage': request.data.get('progress_percentage', 0),
                'completed': request.data.get('completed', False)
            }
        )
        
        serializer = self.get_serializer(progress)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def by_course(self, request):
        """Obtener progreso de un curso específico"""
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response(
                {'error': 'course_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        progress = self.get_queryset().filter(
            lesson__module__course_id=course_id
        )
        serializer = self.get_serializer(progress, many=True)
        return Response(serializer.data)


class LessonDetailView(generics.RetrieveAPIView):
    """Vista para obtener detalle de una lección"""
    queryset = Lesson.objects.all()
    serializer_class = LessonDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, *args, **kwargs):
        lesson = self.get_object()
        
        # Verificar acceso al curso
        if not lesson.is_preview:
            has_access = CourseAccess.objects.filter(
                user=request.user,
                course=lesson.module.course,
                is_active=True
            ).exists()
            
            if not has_access:
                return Response(
                    {'error': 'No tienes acceso a esta lección'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = self.get_serializer(lesson)
        return Response(serializer.data)


class LessonDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet para documentos adjuntos a lecciones.
    
    GET  /courses/lessons/<lesson_pk>/documents/         → lista (requiere acceso al curso)
    POST /courses/lessons/<lesson_pk>/documents/         → subir archivo (admin)
    GET  /courses/documents/<pk>/                        → detalle
    DELETE /courses/documents/<pk>/                      → borrar (admin)
    """
    serializer_class = LessonDocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        lesson_pk = self.kwargs.get('lesson_pk')
        if lesson_pk:
            return LessonDocument.objects.filter(lesson_id=lesson_pk)
        return LessonDocument.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def _check_lesson_access(self, request, lesson):
        """Verifica que el usuario tenga acceso al curso de la lección."""
        if lesson.is_preview:
            return True
        return CourseAccess.objects.filter(
            user=request.user,
            course=lesson.module.course,
            is_active=True
        ).exists()

    def list(self, request, *args, **kwargs):
        lesson_pk = self.kwargs.get('lesson_pk')
        lesson = get_object_or_404(Lesson, pk=lesson_pk)
        if not self._check_lesson_access(request, lesson):
            return Response({'error': 'No tienes acceso a esta lección'}, status=status.HTTP_403_FORBIDDEN)
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        lesson_pk = self.kwargs.get('lesson_pk')
        lesson = get_object_or_404(Lesson, pk=lesson_pk)
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(lesson=lesson)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        # Borrar el archivo físico al eliminar el registro
        if instance.file:
            try:
                instance.file.delete(save=False)
            except Exception:
                pass
        instance.delete()