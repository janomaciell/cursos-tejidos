from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import json
import logging
from .models import Transaction
from .mercadopago import MercadoPagoService

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def mercadopago_webhook(request):
    """Webhook para notificaciones de Mercado Pago"""
    try:
        data = json.loads(request.body)
        logger.info(f"Webhook recibido: {data}")
        
        # Verificar que sea una notificación de pago
        if data.get("type") == "payment":
            payment_id = data.get("data", {}).get("id")
            
            if not payment_id:
                return JsonResponse({"status": "error", "message": "No payment_id"}, status=400)
            
            # Obtener información del pago
            mp_service = MercadoPagoService()
            payment_info = mp_service.get_payment_info(payment_id)
            
            # Buscar o crear transacción
            transaction, created = Transaction.objects.get_or_create(
                mp_payment_id=str(payment_id),
                defaults={
                    'status': 'pending',
                    'raw_data': payment_info
                }
            )
            
            # Actualizar estado
            mp_status = payment_info.get("status")
            transaction.status = map_mp_status(mp_status)
            transaction.payment_method = payment_info.get("payment_method_id", "")
            transaction.payment_type = payment_info.get("payment_type_id", "")
            transaction.mp_merchant_order_id = str(payment_info.get("order", {}).get("id", ""))
            transaction.raw_data = payment_info
            
            # Si está aprobado, dar acceso al curso
            if transaction.status == 'approved':
                transaction.approve()
                logger.info(f"Pago {payment_id} aprobado - Acceso otorgado")
            
            transaction.save()
            
            return JsonResponse({"status": "success"}, status=200)
        
        return JsonResponse({"status": "ignored"}, status=200)
    
    except Exception as e:
        logger.error(f"Error en webhook: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


def map_mp_status(mp_status):
    """Mapear estados de Mercado Pago a estados internos"""
    status_map = {
        "approved": "approved",
        "pending": "pending",
        "in_process": "pending",
        "rejected": "rejected",
        "cancelled": "cancelled",
        "refunded": "refunded",
    }
    return status_map.get(mp_status, "pending")