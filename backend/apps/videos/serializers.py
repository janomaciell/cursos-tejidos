from rest_framework import serializers
from .models import VideoToken

class VideoTokenSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = VideoToken
        fields = ('id', 'lesson', 'lesson_title', 'token', 'expires_at', 'is_expired', 'created_at')
        read_only_fields = ('id', 'token', 'expires_at', 'created_at')