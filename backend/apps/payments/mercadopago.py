import mercadopago
import hmac
import hashlib
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class MercadoPagoService:
    def __init__(self):
        token = getattr(settings, 'MERCADOPAGO_ACCESS_TOKEN', '').strip()
        if not token:
            raise ValueError(
                'MERCADOPAGO_ACCESS_TOKEN no está configurado. '
                'Agregalo en tu .env'
            )
        self.sdk = mercadopago.SDK(token)

    def create_preference(self, course, user, return_url, notification_url):
        """Crear preferencia de pago en Mercado Pago (Checkout Pro).
        
        return_url puede ser la página del curso (ej. /cursos/slug) para uso en el front.
        Las back_urls (success/failure/pending) se construyen siempre desde la URL base
        del frontend, no desde return_url, para evitar rutas como /cursos/slug/payment-success.
        """
        # URL base del frontend (origen de las rutas /payment-success, etc.)
        frontend_url = getattr(settings, 'FRONTEND_URL', '').strip()
        if frontend_url:
            base_url = frontend_url.rstrip('/')
        else:
            base_url = "http://localhost:5173"
        
        logger.info(f"[MP] Using base_url for back_urls: {base_url} (return_url ignored for back_urls)")
        
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
                "name": user.first_name or "Cliente",
                "surname": user.last_name or "Sin apellido",
                "email": user.email,
            },
            "back_urls": {
                "success": f"{base_url}/payment-success",
                "failure": f"{base_url}/payment-failure",
                "pending": f"{base_url}/payment-pending",
            },
            "auto_return": "approved",
            "notification_url": notification_url,
            "statement_descriptor": "CURSO COSTURA",
            "external_reference": f"user_{user.id}_course_{course.id}",
            "metadata": {
                "user_id": user.id,
                "course_id": course.id,
            }
        }

        try:
            logger.info(f"[MP] Creating preference for course: {course.title}")
            logger.info(f"[MP] Notification URL: {notification_url}")
            logger.info(f"[MP] Back URLs: success={base_url}/payment-success, etc.")
            
            preference_response = self.sdk.preference().create(preference_data)

            response_status = preference_response.get("status", 200)
            if response_status >= 400:
                error_detail = preference_response.get("response", {})
                error_msg = error_detail.get("message", "Error desconocido de Mercado Pago")
                logger.error(f"[MP] Error {response_status}: {error_detail}")
                raise Exception(error_msg)

            preference = preference_response["response"]
            
            logger.info(f"[MP] ✓ Preference created: {preference['id']}")

            init_point = preference["init_point"]
            sandbox_init_point = (preference.get("sandbox_init_point") or "").strip()
            # Si MP no devuelve sandbox_init_point → estás con token de PRODUCCIÓN.
            # Para sandbox real usa "Credenciales de prueba" en el panel de MP.
            if not sandbox_init_point and init_point and "sandbox." not in init_point:
                sandbox_init_point = init_point.replace("www.mercadopago", "sandbox.mercadopago")
                logger.warning("[MP] sandbox_init_point no venía en la respuesta (token producción?). Usando URL sandbox derivada.")
            if not sandbox_init_point:
                sandbox_init_point = init_point

            return {
                "preference_id": preference["id"],
                "init_point": init_point,
                "sandbox_init_point": sandbox_init_point,
            }
        except Exception as e:
            logger.error(f"[MP] Error creating preference: {str(e)}")
            raise Exception(f"Error al crear preferencia de MP: {str(e)}")

    def create_cart_preference(self, courses, user, return_url, notification_url):
        """Crear preferencia de pago en Mercado Pago para múltiples cursos (Carrito)."""
        frontend_url = getattr(settings, 'FRONTEND_URL', '').strip()
        base_url = frontend_url.rstrip('/') if frontend_url else "http://localhost:5173"
        
        logger.info(f"[MP] Using base_url for back_urls: {base_url}")
        
        items = []
        for course in courses:
            items.append({
                "title": course.title,
                "quantity": 1,
                "unit_price": float(course.price),
                "currency_id": "ARS",
            })

        # Para MP solo podemos pasar un external_reference y una cantidad limitada de metadata.
        # Combinamos los ids
        course_ids = "_".join([str(c.id) for c in courses])
        
        preference_data = {
            "items": items,
            "payer": {
                "name": user.first_name or "Cliente",
                "surname": user.last_name or "Sin apellido",
                "email": user.email,
            },
            "back_urls": {
                "success": f"{base_url}/payment-success",
                "failure": f"{base_url}/payment-failure",
                "pending": f"{base_url}/payment-pending",
            },
            "auto_return": "approved",
            "notification_url": notification_url,
            "statement_descriptor": "CURSOS COSTURA",
            "external_reference": f"user_{user.id}_courses_{course_ids}",
            "metadata": {
                "user_id": user.id,
                "course_ids": course_ids,
            }
        }

        try:
            logger.info(f"[MP] Creating cart preference for {len(courses)} courses")
            preference_response = self.sdk.preference().create(preference_data)

            response_status = preference_response.get("status", 200)
            if response_status >= 400:
                error_detail = preference_response.get("response", {})
                error_msg = error_detail.get("message", "Error desconocido de Mercado Pago")
                logger.error(f"[MP] Error {response_status}: {error_detail}")
                raise Exception(error_msg)

            preference = preference_response["response"]
            logger.info(f"[MP] ✓ Cart Preference created: {preference['id']}")

            init_point = preference["init_point"]
            sandbox_init_point = (preference.get("sandbox_init_point") or "").strip()
            if not sandbox_init_point and init_point and "sandbox." not in init_point:
                sandbox_init_point = init_point.replace("www.mercadopago", "sandbox.mercadopago")
            if not sandbox_init_point:
                sandbox_init_point = init_point

            return {
                "preference_id": preference["id"],
                "init_point": init_point,
                "sandbox_init_point": sandbox_init_point,
            }
        except Exception as e:
            logger.error(f"[MP] Error creating cart preference: {str(e)}")
            raise Exception(f"Error al crear preferencia de MP para carrito: {str(e)}")

    def search_payments_by_preference(self, preference_id):
        """Buscar pagos asociados a una preferencia por preference_id.
        
        IMPORTANTE: Este método puede no funcionar correctamente porque
        MercadoPago no siempre indexa por preference_id. Es mejor usar
        external_reference.
        """
        try:
            logger.info(f"[MP] Searching payments by preference_id: {preference_id}")
            
            # Nota: La API de búsqueda de MP es limitada
            # Intentar con filters básicos
            filters = {
                "preference_id": preference_id
            }
            
            search_result = self.sdk.payment().search(filters)
            
            response_status = search_result.get("status", 200)
            if response_status >= 400:
                logger.warning(f"[MP] Search by preference failed: status {response_status}")
                return None
            
            results = search_result.get("response", {}).get("results", [])
            
            if results:
                logger.info(f"[MP] ✓ Found {len(results)} payment(s) by preference_id")
                return results[0]
            
            logger.info(f"[MP] No payments found by preference_id")
            return None
            
        except Exception as e:
            logger.error(f"[MP] Error searching by preference: {str(e)}")
            return None

    def search_payments_by_external_reference(self, external_reference):
        """Buscar pagos por external_reference.
        
        La API de MP requiere sort, criteria y range; sin ellos devuelve 400.
        """
        try:
            logger.info(f"[MP] Searching payments by external_reference: {external_reference}")
            
            # Parámetros requeridos; la doc de MP usa begin_date=NOW-30DAYS y end_date=NOW
            filters = {
                "external_reference": external_reference,
                "sort": "date_created",
                "criteria": "desc",
                "range": "date_created",
                "begin_date": "NOW-30DAYS",
                "end_date": "NOW",
            }
            
            search_result = self.sdk.payment().search(filters)
            
            response_status = search_result.get("status", 200)
            if response_status >= 400:
                logger.warning(
                    f"[MP] Search by external_reference failed: status {response_status}, "
                    f"response={search_result.get('response', {})}"
                )
                return None
            
            resp = search_result.get("response", {})
            results = resp.get("results", [])
            paging = resp.get("paging", {})
            total = paging.get("total", 0)
            
            if results:
                first = results[0]
                logger.info(
                    f"[MP] ✓ Found {len(results)} payment(s), total={total}, "
                    f"first id={first.get('id')}, status={first.get('status')}"
                )
                return first
            
            logger.info(f"[MP] No payments found by external_reference (total={total})")
            return None
            
        except Exception as e:
            logger.error(f"[MP] Error searching by external_reference: {str(e)}")
            return None

    def get_payment_info(self, payment_id):
        """Obtener información completa de un pago"""
        try:
            logger.info(f"[MP] Getting payment info: {payment_id}")
            
            payment_response = self.sdk.payment().get(payment_id)

            response_status = payment_response.get("status", 200)
            if response_status >= 400:
                error_detail = payment_response.get("response", {})
                error_msg = error_detail.get("message", "Error al obtener pago")
                logger.error(f"[MP] Error getting payment: {error_detail}")
                raise Exception(error_msg)

            payment_data = payment_response["response"]
            logger.info(f"[MP] ✓ Payment info retrieved: status={payment_data.get('status')}")
            
            return payment_data
            
        except Exception as e:
            logger.error(f"[MP] Error getting payment info: {str(e)}")
            raise Exception(f"Error al obtener info del pago: {str(e)}")

    def verify_webhook_signature(self, request):
        """Verificar firma HMAC del webhook de Mercado Pago.
        
        MP envía estos headers:
        - X-Request-Id: identificador único de la notificación
        - X-Signature: firma HMAC-SHA256
        - X-Resource-Url: URL del recurso notificado
        
        La firma se calcula así:
            firma = HMAC-SHA256(secret_key, "id:{X-Request-Id}&resource_url:{X-Resource-Url}")
        
        En desarrollo (sin secret configurado) se permite todo.
        """
        webhook_secret = getattr(settings, 'MERCADOPAGO_WEBHOOK_SECRET', '').strip()

        # En desarrollo sin secret, permitir todo para no bloquear testing
        if not webhook_secret:
            logger.info("[MP Webhook] No secret configured - allowing in dev mode")
            return True

        signature = request.META.get('HTTP_X_SIGNATURE', '')
        request_id = request.META.get('HTTP_X_REQUEST_ID', '')
        resource_url = request.META.get('HTTP_X_RESOURCE_URL', '')

        if not signature or not request_id:
            logger.warning(f"[MP Webhook] Missing signature or request_id")
            # En desarrollo sin secret, permitir de todas formas
            if not webhook_secret:
                return True
            return False

        # Construir el string a firmar
        string_to_sign = f"id:{request_id}&resource_url:{resource_url}"

        # Calcular HMAC-SHA256
        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            string_to_sign.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        # Comparar de forma segura
        is_valid = hmac.compare_digest(signature, expected_signature)
        
        if not is_valid:
            logger.warning(f"[MP Webhook] Invalid signature")
        else:
            logger.info(f"[MP Webhook] ✓ Signature valid")
            
        return is_valid