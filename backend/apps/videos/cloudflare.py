import requests
import jwt
import time
from django.conf import settings
from datetime import datetime, timedelta

class CloudflareStreamService:
    def __init__(self):
        self.account_id = settings.CLOUDFLARE_ACCOUNT_ID
        self.api_token = settings.CLOUDFLARE_API_TOKEN
        self.stream_url = settings.CLOUDFLARE_STREAM_URL
        self.headers = {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }
    
    def get_video_info(self, video_id):
        """Obtener información de un video"""
        url = f"{self.stream_url}/{video_id}"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            return response.json()['result']
        else:
            raise Exception(f"Error al obtener info del video: {response.text}")

def generate_signed_token(self, video_id, expiration_hours=2):
    """Generar token firmado para acceso al video"""
    exp_time = int(time.time()) + (expiration_hours * 3600)
    
    payload = {
        'sub': video_id,
        'kid': self.account_id,
        'exp': exp_time,
        'nbf': int(time.time()),
        'accessRules': [
            {
                'type': 'ip.geoip.country',
                'action': 'allow',
                'country': ['AR']  # Permitir solo desde Argentina (puedes cambiar)
            }
        ]
    }
    
    # Generar JWT
    token = jwt.encode(payload, self.api_token, algorithm='RS256')
    return token

def get_video_url(self, video_id, signed=True):
    """Obtener URL del video"""
    base_url = f"https://customer-{self.account_id}.cloudflarestream.com/{video_id}"
    
    if signed:
        token = self.generate_signed_token(video_id)
        return f"{base_url}/manifest/video.m3u8?token={token}"
    
    return f"{base_url}/manifest/video.m3u8"

def upload_video(self, video_file, name):
    """Subir video a Cloudflare Stream"""
    url = self.stream_url
    
    files = {
        'file': video_file
    }
    
    data = {
        'meta': {
            'name': name
        }
    }
    
    response = requests.post(
        url,
        headers={'Authorization': f'Bearer {self.api_token}'},
        files=files,
        data=data
    )
    
    if response.status_code == 200:
        return response.json()['result']
    else:
        raise Exception(f"Error al subir video: {response.text}")