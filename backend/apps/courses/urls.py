from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'courses'

router = DefaultRouter()
router.register(r'', views.CourseViewSet, basename='course')
router.register(r'progress', views.LessonProgressViewSet, basename='progress')

urlpatterns = [
    path('lessons/<int:pk>/', views.LessonDetailView.as_view(), name='lesson-detail'),
    path('', include(router.urls)),
]