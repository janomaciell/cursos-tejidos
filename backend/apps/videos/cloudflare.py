import requests
import time
from django.conf import settings

class CloudflareStreamService:
    def __init__(self):
        self.account_id = settings.CLOUDFLARE_ACCOUNT_ID
        self.api_token = settings.CLOUDFLARE_API_TOKEN
        self.customer_subdomain = settings.CLOUDFLARE_CUSTOMER_SUBDOMAIN  # customer-kxu768ci6pk5yzue
        self.stream_url = settings.CLOUDFLARE_STREAM_URL
        self.headers = {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }

    def get_video_info(self, video_id):
        url = f"{self.stream_url}/{video_id}"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            return response.json()['result']
        raise Exception(f"Error al obtener info del video: {response.text}")

    def get_video_url(self, video_id, signed=False):
        """URL HLS directa del video (sin firma por ahora)"""
        return f"https://{self.customer_subdomain}.cloudflarestream.com/{video_id}/manifest/video.m3u8"

    def get_embed_url(self, video_id):
        """URL iframe — opción más simple, sin necesidad de hls.js"""
        return f"https://iframe.videodelivery.net/{video_id}"

    def upload_video(self, video_file, name):
        response = requests.post(
            self.stream_url,
            headers={'Authorization': f'Bearer {self.api_token}'},
            files={'file': video_file},
            data={'meta': f'{{"name": "{name}"}}'}
        )
        if response.status_code == 200:
            return response.json()['result']
        raise Exception(f"Error al subir video: {response.text}")