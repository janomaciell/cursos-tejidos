from django.core.exceptions import ValidationError
import re

def validate_phone_number(value):
    """Validar formato de teléfono"""
    pattern = r'^\+?1?\d{9,15}$'
    if not re.match(pattern, value):
        raise ValidationError('Formato de teléfono inválido')

def validate_video_id(value):
    """Validar formato de video ID de Cloudflare"""
    pattern = r'^[a-f0-9]{32}$'
    if not re.match(pattern, value):
        raise ValidationError('Formato de video ID inválido')