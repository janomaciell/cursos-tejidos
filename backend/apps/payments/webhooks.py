from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import json
import logging
import re
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

        # ------------------------------------------------------------------
        # Resolver user / course a partir de metadata y external_reference
        # ------------------------------------------------------------------
        external_reference = payment_info.get("external_reference", "") or ""
        metadata = payment_info.get("metadata", {}) or {}

        meta_user_id = metadata.get("user_id")
        meta_course_id = metadata.get("course_id")

        ref_user_id = None
        ref_course_id = None
        if external_reference:
            # external_reference esperado: "user_{user_id}_course_{course_id}"
            match = re.match(r"user_(\d+)_course_(\d+)", str(external_reference).strip())
            if match:
                ref_user_id, ref_course_id = int(match.group(1)), int(match.group(2))

        user_id = meta_user_id or ref_user_id
        course_id = meta_course_id or ref_course_id

        if not user_id or not course_id:
            logger.error(
                f"Webhook pago {payment_id}: no se pudo resolver user_id/course_id "
                f"(metadata={metadata}, external_reference={external_reference})"
            )
            return JsonResponse(
                {"status": "error", "message": "No se pudo resolver usuario/curso del pago"},
                status=400,
            )

        try:
            user = User.objects.get(id=user_id)
            course = Course.objects.get(id=course_id)
        except (User.DoesNotExist, Course.DoesNotExist) as e:
            logger.error(f"Webhook pago {payment_id}: usuario o curso no encontrado - {e}")
            return JsonResponse(
                {"status": "error", "message": "Usuario o curso no encontrado"},
                status=400,
            )

        # ------------------------------------------------------------------
        # Buscar/crear la transacción correcta (idempotente: MP puede enviar el webhook 2+ veces)
        # ------------------------------------------------------------------
        pref_id = payment_info.get("preference_id") or ""
        transaction = None

        # 0) Si ya existe una transacción con este payment_id, usarla (evita UNIQUE constraint)
        transaction = Transaction.objects.filter(mp_payment_id=str(payment_id)).first()

        # 1) Si no, intentar por preference_id + usuario + curso (flujo normal)
        if not transaction and pref_id:
            transaction = (
                Transaction.objects.filter(
                    mp_preference_id=pref_id,
                    user=user,
                    course=course,
                )
                .order_by("-created_at")
                .first()
            )

        # 2) Si no está, tomar la última transacción pendiente de ese user/curso
        if not transaction:
            transaction = (
                Transaction.objects.filter(
                    user=user,
                    course=course,
                    status="pending",
                )
                .order_by("-created_at")
                .first()
            )

        # 3) Si sigue sin encontrarse, crear una nueva usando los datos del pago
        if not transaction:
            transaction = Transaction(
                user=user,
                course=course,
                mp_preference_id=pref_id,
                amount=payment_info.get("transaction_amount", 0),
                status="pending",
            )

        # En todos los casos, asociar el payment_id actual
        transaction.mp_payment_id = str(payment_id)

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