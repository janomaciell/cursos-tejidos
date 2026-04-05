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
from .email_service import send_payment_confirmation

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def mercadopago_webhook(request):
    """Webhook para notificaciones de Mercado Pago (Soporta Carrito y Pago Individual)"""
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
        # Resolver user y courses a partir de metadata y external_reference
        # ------------------------------------------------------------------
        external_reference = payment_info.get("external_reference", "") or ""
        metadata = payment_info.get("metadata", {}) or {}

        # 1. Intentar metadata
        user_id = metadata.get("user_id")
        course_ids_str = metadata.get("course_ids")  # Formato: "5_8_12"
        if not course_ids_str and metadata.get("course_id"):
            course_ids_str = str(metadata.get("course_id"))

        # 2. Si no hay en metadata, intentar external_reference
        if not user_id or not course_ids_str:
            if external_reference:
                # Checkout individual: "user_1_course_5"
                match_single = re.match(r"user_(\d+)_course_(\d+)", str(external_reference).strip())
                if match_single:
                    user_id = int(match_single.group(1))
                    course_ids_str = match_single.group(2)
                else:
                    # Checkout carrito: "user_1_courses_5_8_12"
                    match_cart = re.match(r"user_(\d+)_courses_(.+)", str(external_reference).strip())
                    if match_cart:
                        user_id = int(match_cart.group(1))
                        course_ids_str = match_cart.group(2)

        if not user_id or not course_ids_str:
            logger.error(
                f"Webhook pago {payment_id}: no se pudo resolver user_id/courses "
                f"(metadata={metadata}, external_reference={external_reference})"
            )
            return JsonResponse(
                {"status": "error", "message": "No se pudo resolver usuario/cursos del pago"},
                status=400,
            )

        course_ids = [int(cid) for cid in str(course_ids_str).split("_") if cid.strip().isdigit()]

        try:
            user = User.objects.get(id=user_id)
            courses = Course.objects.filter(id__in=course_ids)
            if len(courses) != len(course_ids):
                logger.warning(f"Webhook: no se encontraron todos los cursos {course_ids}")
        except User.DoesNotExist:
            logger.error(f"Webhook pago {payment_id}: usuario no encontrado")
            return JsonResponse(
                {"status": "error", "message": "Usuario no encontrado"},
                status=400,
            )

        pref_id = payment_info.get("preference_id") or ""
        mp_status = payment_info.get("status")
        internal_status = map_mp_status(mp_status)

        for course in courses:
            # ------------------------------------------------------------------
            # Buscar/crear la transacción correcta (idempotente)
            # ------------------------------------------------------------------
            transaction = None

            # 0) Por payment_id + course
            transaction = Transaction.objects.filter(mp_payment_id=str(payment_id), course=course).first()

            # 1) Por preference_id + usuario + course
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

            # 2) Última transacción pendiente
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

            # 3) Nueva
            if not transaction:
                transaction = Transaction(
                    user=user,
                    course=course,
                    mp_preference_id=pref_id,
                    amount=course.price,
                    status="pending",
                )

            transaction.mp_payment_id = str(payment_id)
            transaction.status = internal_status
            transaction.payment_method = payment_info.get("payment_method_id", "")
            transaction.payment_type = payment_info.get("payment_type_id", "")
            transaction.mp_merchant_order_id = str(payment_info.get("order", {}).get("id", ""))
            transaction.raw_data = payment_info

            # Aprobar y notificar
            if transaction.status == 'approved':
                already_approved = True if transaction.pk and Transaction.objects.filter(pk=transaction.pk, status='approved').exists() else False

                transaction.approve()
                transaction.save()

                if not already_approved:
                    try:
                        send_payment_confirmation(transaction, payment_info)
                    except Exception as e:
                        logger.error(f"Error al enviar email para tx {transaction.id}: {e}")
                logger.info(f"Pago {payment_id} aprobado para curso {course.title}")
            else:
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