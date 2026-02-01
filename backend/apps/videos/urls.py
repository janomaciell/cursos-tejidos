from django.urls import path
from . import views

app_name = 'videos'

urlpatterns = [
    path('token/<int:lesson_id>/', views.get_video_token, name='video-token'),
    path('info/<int:lesson_id>/', views.get_video_info, name='video-info'),
]