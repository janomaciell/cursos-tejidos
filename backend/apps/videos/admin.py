from django.contrib import admin
from .models import VideoToken

@admin.register(VideoToken)
class VideoTokenAdmin(admin.ModelAdmin):
    list_display = ('lesson', 'is_expired', 'expires_at', 'created_at')
    list_filter = ('expires_at', 'created_at')
    search_fields = ('lesson__title',)
    readonly_fields = ('created_at',)