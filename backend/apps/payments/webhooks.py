from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import json
import logging
from .models import Transaction, CourseAccess
from .mercadopago import MercadoPagoService
from apps.users.models import User
from apps.courses.models import Course

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def mercadopago_webhook(request):
    """Webhook para notificaciones de Mercado Pago"""
    try:
        # Verificar firma del webhook
        mp_service = MercadoPagoService()
        if not mp_service.verify_webhook_signature(request):
            logger.warning("Webhook con firma inválida rechazado")
            return JsonResponse({"status": "error", "message": "Firma inválida"}, status=401)

        data = json.loads(request.body)
        logger.info(f"Webhook recibido: {data}")

        # Solo procesar notificaciones de tipo "payment"
        if data.get("type") != "payment":
            return JsonResponse({"status": "ignored"}, status=200)

        payment_id = data.get("data", {}).get("id")
        if not payment_id:
            return JsonResponse({"status": "error", "message": "No payment_id"}, status=400)

        # Obtener información completa del pago desde la API de MP
        payment_info = mp_service.get_payment_info(payment_id)

        # Intentar buscar la transacción existente por preference_id
        # (la creamos en create_payment cuando el usuario inició el pago)
        external_reference = payment_info.get("external_reference", "")
        # external_reference tiene formato: "user_{user_id}_course_{course_id}"
        transaction = Transaction.objects.filter(
            mp_preference_id=payment_info.get("preference_id", "")
        ).first()

        if transaction:
            # La transacción ya existe, solo actualizar el payment_id
            transaction.mp_payment_id = str(payment_id)
        else:
            # FIX: si por alguna razón no existe (edge case),
            # recrearla con user y course extraídos del metadata del pago.
            metadata = payment_info.get("metadata", {})
            user_id = metadata.get("user_id")
            course_id = metadata.get("course_id")

            if not user_id or not course_id:
                logger.error(f"Webhook pago {payment_id}: no se encontró user_id o course_id en metadata")
                return JsonResponse(
                    {"status": "error", "message": "Metadata incompleta"},
                    status=400
                )

            try:
                user = User.objects.get(id=user_id)
                course = Course.objects.get(id=course_id)
            except (User.DoesNotExist, Course.DoesNotExist) as e:
                logger.error(f"Webhook pago {payment_id}: usuario o curso no encontrado - {e}")
                return JsonResponse(
                    {"status": "error", "message": "Usuario o curso no encontrado"},
                    status=400
                )

            transaction = Transaction(
                user=user,
                course=course,
                mp_payment_id=str(payment_id),
                mp_preference_id=payment_info.get("preference_id", ""),
                amount=payment_info.get("transaction_amount", 0),
                status='pending',
            )

        # Actualizar campos del pago
        mp_status = payment_info.get("status")
        transaction.status = map_mp_status(mp_status)
        transaction.payment_method = payment_info.get("payment_method_id", "")
        transaction.payment_type = payment_info.get("payment_type_id", "")
        transaction.mp_merchant_order_id = str(payment_info.get("order", {}).get("id", ""))
        transaction.raw_data = payment_info

        # Si está aprobado, dar acceso al curso
        # FIX: approve() ya no hace save(), así que el único save() es este de abajo
        if transaction.status == 'approved':
            transaction.approve()
            logger.info(f"Pago {payment_id} aprobado - Acceso otorgado")

        transaction.save()

        return JsonResponse({"status": "success"}, status=200)

    except Exception as e:
        logger.error(f"Error en webhook: {str(e)}", exc_info=True)
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