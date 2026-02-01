import mercadopago
from django.conf import settings
from decimal import Decimal

class MercadoPagoService:
    def __init__(self):
        self.sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
    
    def create_preference(self, course, user, return_url, notification_url):
        """Crear preferencia de pago en Mercado Pago"""
        preference_data = {
            "items": [
                {
                    "title": course.title,
                    "quantity": 1,
                    "unit_price": float(course.price),
                    "currency_id": "ARS",
                }
            ],
            "payer": {
                "name": user.first_name,
                "surname": user.last_name,
                "email": user.email,
            },
            "back_urls": {
                "success": f"{return_url}?status=success",
                "failure": f"{return_url}?status=failure",
                "pending": f"{return_url}?status=pending",
            },
            "auto_return": "approved",
            "notification_url": notification_url,
            "statement_descriptor": "ELEARNING COURSE",
            "external_reference": f"user_{user.id}_course_{course.id}",
            "metadata": {
                "user_id": user.id,
                "course_id": course.id,
            }
        }
        
        try:
            preference_response = self.sdk.preference().create(preference_data)
            preference = preference_response["response"]
            return {
                "preference_id": preference["id"],
                "init_point": preference["init_point"],
                "sandbox_init_point": preference.get("sandbox_init_point", ""),
            }
        except Exception as e:
            raise Exception(f"Error al crear preferencia de MP: {str(e)}")
    
    def get_payment_info(self, payment_id):
        """Obtener información de un pago"""
        try:
            payment_info = self.sdk.payment().get(payment_id)
            return payment_info["response"]
        except Exception as e:
            raise Exception(f"Error al obtener info del pago: {str(e)}")
    
    def verify_webhook_signature(self, request):
        """Verificar firma del webhook (implementación básica)"""
        # Aquí deberías implementar la verificación de la firma
        # Por ahora retornamos True para testing
        return True