from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'courses'

# ── Root router: cursos ────────────────────────────────────────────────────────
courses_router = DefaultRouter()
courses_router.register(r'', views.CourseViewSet, basename='course')

# ── Progreso ───────────────────────────────────────────────────────────────────
progress_router = DefaultRouter()
progress_router.register(r'', views.LessonProgressViewSet, basename='progress')

# ── Documentos (standalone: retrieve / destroy) ────────────────────────────────
documents_router = DefaultRouter()
documents_router.register(r'documents', views.LessonDocumentViewSet, basename='document')

urlpatterns = [
    # Lección individual
    path('lessons/<int:pk>/', views.LessonDetailView.as_view(), name='lesson-detail'),

    # Documentos anidados: GET/POST  /api/courses/lessons/<lesson_pk>/documents/
    path(
        'lessons/<int:lesson_pk>/documents/',
        views.LessonDocumentViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='lesson-documents',
    ),

    # Documento individual: GET / DELETE  /api/courses/documents/<pk>/
    path(
        'documents/<int:pk>/',
        views.LessonDocumentViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}),
        name='document-detail',
    ),

    # Progreso: /api/courses/progress/
    path('progress/', include(progress_router.urls)),

    # Cursos — al final para no interceptar rutas anteriores
    path('', include(courses_router.urls)),
]