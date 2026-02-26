from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'courses'

# Router principal para cursos
courses_router = DefaultRouter()
courses_router.register(r'', views.CourseViewSet, basename='course')

# Router separado para progreso — evita conflicto con el ViewSet de cursos
progress_router = DefaultRouter()
progress_router.register(r'', views.LessonProgressViewSet, basename='progress')

urlpatterns = [
    # Lección individual
    path('lessons/<int:pk>/', views.LessonDetailView.as_view(), name='lesson-detail'),

    # Progreso — montado en /courses/progress/ con su propio router
    path('progress/', include(progress_router.urls)),

    # Cursos — al final para no interceptar las rutas anteriores
    path('', include(courses_router.urls)),
]