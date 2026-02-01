from django.db import models
from apps.courses.models import Lesson

class VideoToken(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='video_tokens')
    token = models.CharField('Token', max_length=500)
    expires_at = models.DateTimeField('Expira en')
    created_at = models.DateTimeField('Creado en', auto_now_add=True)

    class Meta:
        db_table = 'video_tokens'
        verbose_name = 'Token de video'
        verbose_name_plural = 'Tokens de videos'
        ordering = ['-created_at']

    def __str__(self):
        return f"Token for {self.lesson.title}"

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at