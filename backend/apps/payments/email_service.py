"""
payments/email_service.py

Servicio de email para confirmaciones de pago.
Envía un correo HTML premium al cliente cuando su pago es aprobado.

Uso:
    from .email_service import send_payment_confirmation
    send_payment_confirmation(transaction, payment_info)
"""

import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def send_payment_confirmation(transaction, payment_info: dict):
    """
    Envía el email de confirmación de compra al usuario.

    Args:
        transaction: instancia de Transaction (ya aprobada, con user y course cargados)
        payment_info: dict con la respuesta cruda de la API de Mercado Pago
    """
    try:
        user    = transaction.user
        course  = transaction.course

        # ── Datos de la transacción ──────────────────────────────────
        payment_id      = transaction.mp_payment_id or "—"
        preference_id   = transaction.mp_preference_id or "—"
        order_id        = transaction.mp_merchant_order_id or "—"
        amount          = transaction.amount
        approved_at     = transaction.approved_at or timezone.now()
        payment_method  = _friendly_method(transaction.payment_method, transaction.payment_type)

        # Datos extra de MP (raw_data / payment_info)
        payer           = payment_info.get("payer", {}) or {}
        payer_email     = payer.get("email", user.email)
        installments    = payment_info.get("installments", 1) or 1
        currency        = payment_info.get("currency_id", "ARS")

        # URLs
        frontend_url    = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
        course_url      = f"{frontend_url}/cursos/{course.slug}" if frontend_url else ""
        support_email   = getattr(settings, "DEFAULT_FROM_EMAIL", "soporte@tejidosandy.com")

        # ── Asunto ──────────────────────────────────────────────────
        subject = f"✅ Pago confirmado — {course.title}"

        # ── Cuerpo plain-text (fallback) ─────────────────────────────
        text_body = _build_plain_text(
            user=user,
            course=course,
            payment_id=payment_id,
            preference_id=preference_id,
            order_id=order_id,
            amount=amount,
            currency=currency,
            approved_at=approved_at,
            payment_method=payment_method,
            installments=installments,
            course_url=course_url,
            support_email=support_email,
        )

        # ── Cuerpo HTML ──────────────────────────────────────────────
        html_body = _build_html(
            user=user,
            course=course,
            payment_id=payment_id,
            preference_id=preference_id,
            order_id=order_id,
            amount=amount,
            currency=currency,
            approved_at=approved_at,
            payment_method=payment_method,
            installments=installments,
            course_url=course_url,
            support_email=support_email,
        )

        # ── Enviar ───────────────────────────────────────────────────
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", support_email)
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=from_email,
            to=[user.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)

        logger.info(
            f"[Email] Confirmación enviada a {user.email} "
            f"| Curso: {course.title} | Pago: {payment_id}"
        )

    except Exception as exc:
        # El email nunca debe romper el flujo principal del webhook
        logger.error(f"[Email] Error al enviar confirmación: {exc}", exc_info=True)


# ════════════════════════════════════════════════════════════════════════════
# Helpers internos
# ════════════════════════════════════════════════════════════════════════════

def _friendly_method(method: str, ptype: str) -> str:
    """Convierte los códigos de MP a texto legible."""
    labels = {
        "credit_card":  "Tarjeta de crédito",
        "debit_card":   "Tarjeta de débito",
        "account_money":"Dinero en cuenta MP",
        "ticket":       "Pago en efectivo",
        "bank_transfer":"Transferencia bancaria",
        "atm":          "Cajero automático",
    }
    if ptype in labels:
        return labels[ptype]
    if method:
        return method.replace("_", " ").title()
    return "Mercado Pago"


def _format_amount(amount, currency: str) -> str:
    try:
        sym = "$" if currency in ("ARS", "USD") else currency
        return f"{sym} {float(amount):,.2f}"
    except Exception:
        return str(amount)


def _format_date(dt) -> str:
    try:
        local = timezone.localtime(dt)
        return local.strftime("%d/%m/%Y %H:%M hs")
    except Exception:
        return str(dt)


# ── Plain text ───────────────────────────────────────────────────────────────

def _build_plain_text(*, user, course, payment_id, preference_id, order_id,
                      amount, currency, approved_at, payment_method,
                      installments, course_url, support_email) -> str:
    lines = [
        f"Hola {user.first_name},",
        "",
        "¡Tu pago fue confirmado con éxito! 🎉",
        f"Ya tenés acceso completo a: {course.title}",
        "",
        "─── DETALLE DE LA ORDEN ────────────────────────",
        f"  Curso          : {course.title}",
        f"  Monto abonado  : {_format_amount(amount, currency)}",
        f"  Método de pago : {payment_method}",
        *([ f"  Cuotas         : {installments}"] if installments > 1 else []),
        f"  Fecha aprobado : {_format_date(approved_at)}",
        "",
        "─── DATOS DE MERCADO PAGO ──────────────────────",
        f"  ID de pago     : {payment_id}",
        f"  ID de orden    : {order_id}",
        f"  Referencia     : {preference_id}",
        "────────────────────────────────────────────────",
        "",
    ]
    if course_url:
        lines += [f"Accedé a tu curso aquí: {course_url}", ""]
    lines += [
        f"Ante cualquier consulta respondé este correo o escribinos a {support_email}",
        "",
        "¡Muchas gracias por tu compra!",
        "El equipo de Tejiendo con Andy",
    ]
    return "\n".join(lines)


# ── HTML ─────────────────────────────────────────────────────────────────────

def _build_html(*, user, course, payment_id, preference_id, order_id,
                amount, currency, approved_at, payment_method,
                installments, course_url, support_email) -> str:

    amount_str = _format_amount(amount, currency)
    date_str   = _format_date(approved_at)

    cuotas_row = ""
    if installments and installments > 1:
        cuotas_row = f"""
        <tr>
          <td class="label">Cuotas</td>
          <td class="value">{installments} cuotas</td>
        </tr>"""

    cta_block = ""
    if course_url:
        cta_block = f"""
      <div style="text-align:center;margin:32px 0 8px;">
        <a href="{course_url}" class="btn">Ir a mi curso →</a>
      </div>"""

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Pago confirmado</title>
<style>
  /* Reset */
  body,table,td,a{{margin:0;padding:0;border:0;font-size:100%;}}
  body{{background:#f4f1ee;font-family:'Georgia',serif;color:#1a1a1a;}}

  /* Wrapper */
  .wrapper{{max-width:580px;margin:40px auto;background:#fff;
            border-radius:4px;overflow:hidden;
            box-shadow:0 2px 24px rgba(0,0,0,.08);}}

  /* Header */
  .header{{background:#1a1a1a;padding:40px 48px 32px;text-align:center;}}
  .header .badge{{display:inline-block;width:56px;height:56px;
                  background:#c8a96e;border-radius:50%;
                  line-height:56px;font-size:28px;margin-bottom:16px;}}
  .header h1{{color:#fff;font-size:22px;font-weight:400;
              letter-spacing:.04em;margin:0;}}
  .header .sub{{color:#c8a96e;font-size:13px;letter-spacing:.12em;
                text-transform:uppercase;margin-top:6px;}}

  /* Body */
  .body{{padding:40px 48px;}}
  .greeting{{font-size:18px;margin-bottom:6px;}}
  .intro{{color:#555;font-size:14px;line-height:1.7;margin-bottom:28px;}}

  /* Course card */
  .course-card{{background:#faf8f5;border-left:3px solid #c8a96e;
                padding:16px 20px;border-radius:2px;margin-bottom:28px;}}
  .course-card .course-label{{font-size:11px;letter-spacing:.1em;
                               text-transform:uppercase;color:#888;margin-bottom:4px;}}
  .course-card .course-name{{font-size:17px;font-weight:600;color:#1a1a1a;}}

  /* Table */
  .section-title{{font-size:11px;letter-spacing:.1em;text-transform:uppercase;
                  color:#888;margin-bottom:12px;}}
  table.detail{{width:100%;border-collapse:collapse;margin-bottom:24px;}}
  table.detail td{{padding:10px 0;font-size:14px;
                   border-bottom:1px solid #f0ece6;vertical-align:top;}}
  table.detail td.label{{color:#888;width:42%;}}
  table.detail td.value{{color:#1a1a1a;font-weight:500;text-align:right;}}

  /* MP block */
  .mp-block{{background:#f4f1ee;border-radius:4px;padding:18px 20px;
             margin-bottom:28px;}}
  .mp-block .mp-title{{font-size:11px;letter-spacing:.1em;
                        text-transform:uppercase;color:#888;margin-bottom:12px;}}
  .mp-block .mp-row{{display:flex;justify-content:space-between;
                     font-size:13px;margin-bottom:6px;}}
  .mp-block .mp-key{{color:#888;}}
  .mp-block .mp-val{{color:#1a1a1a;font-family:'Courier New',monospace;
                     font-size:12px;word-break:break-all;max-width:60%;text-align:right;}}

  /* CTA */
  .btn{{display:inline-block;background:#1a1a1a;color:#fff !important;
        text-decoration:none;padding:14px 36px;border-radius:2px;
        font-size:14px;letter-spacing:.06em;}}

  /* Footer */
  .footer{{background:#f4f1ee;padding:24px 48px;text-align:center;}}
  .footer p{{font-size:12px;color:#999;line-height:1.6;margin:0;}}
  .footer a{{color:#888;text-decoration:underline;}}
</style>
</head>
<body>
<div class="wrapper">

  <!-- HEADER -->
  <div class="header">
    <div class="badge">✓</div>
    <h1>Pago confirmado</h1>
    <p class="sub">Tejiendo con Andy</p>
  </div>

  <!-- BODY -->
  <div class="body">
    <p class="greeting">Hola, <strong>{user.first_name}</strong> 👋</p>
    <p class="intro">
      ¡Tu compra fue procesada con éxito! A continuación encontrás el
      comprobante completo de tu orden. Ya podés acceder a tu curso.
    </p>

    <!-- Curso -->
    <div class="course-card">
      <div class="course-label">Curso adquirido</div>
      <div class="course-name">{course.title}</div>
    </div>

    <!-- Detalle del pago -->
    <p class="section-title">Detalle del pago</p>
    <table class="detail">
      <tr>
        <td class="label">Monto abonado</td>
        <td class="value">{amount_str}</td>
      </tr>
      <tr>
        <td class="label">Método de pago</td>
        <td class="value">{payment_method}</td>
      </tr>{cuotas_row}
      <tr>
        <td class="label">Fecha de aprobación</td>
        <td class="value">{date_str}</td>
      </tr>
    </table>

    <!-- Datos Mercado Pago -->
    <div class="mp-block">
      <div class="mp-title">Comprobante Mercado Pago</div>
      <div class="mp-row">
        <span class="mp-key">ID de pago</span>
        <span class="mp-val">{payment_id}</span>
      </div>
      <div class="mp-row">
        <span class="mp-key">ID de orden</span>
        <span class="mp-val">{order_id}</span>
      </div>
      <div class="mp-row">
        <span class="mp-key">Referencia</span>
        <span class="mp-val">{preference_id}</span>
      </div>
    </div>

    {cta_block}
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <p>
      ¿Tenés alguna consulta? Respondé este correo o escribinos a
      <a href="mailto:{support_email}">{support_email}</a>.<br>
      Guardá este email como comprobante de tu compra.
    </p>
  </div>

</div>
</body>
</html>"""