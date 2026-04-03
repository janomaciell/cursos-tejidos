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
    try:
        user    = transaction.user
        course  = transaction.course

        payment_id      = transaction.mp_payment_id or "—"
        preference_id   = transaction.mp_preference_id or "—"
        order_id        = transaction.mp_merchant_order_id or "—"
        amount          = transaction.amount
        approved_at     = transaction.approved_at or timezone.now()
        payment_method  = _friendly_method(transaction.payment_method, transaction.payment_type)

        payer           = payment_info.get("payer", {}) or {}
        installments    = payment_info.get("installments", 1) or 1
        currency        = payment_info.get("currency_id", "ARS")

        frontend_url    = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
        course_url      = f"{frontend_url}/mis-cursos" if frontend_url else ""
        support_email   = getattr(settings, "DEFAULT_FROM_EMAIL", "tejiendoconandy@gmail.com")

        subject = f"Pago confirmado - {course.title}"

        text_body = _build_plain_text(
            user=user, course=course, payment_id=payment_id,
            preference_id=preference_id, order_id=order_id,
            amount=amount, currency=currency, approved_at=approved_at,
            payment_method=payment_method, installments=installments,
            course_url=course_url, support_email=support_email,
        )

        html_body = _build_html(
            user=user, course=course, payment_id=payment_id,
            preference_id=preference_id, order_id=order_id,
            amount=amount, currency=currency, approved_at=approved_at,
            payment_method=payment_method, installments=installments,
            course_url=course_url, support_email=support_email,
        )

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
            f"[Email] Confirmacion enviada a {user.email} "
            f"| Curso: {course.title} | Pago: {payment_id}"
        )

    except Exception as exc:
        logger.error(f"[Email] Error al enviar confirmacion: {exc}", exc_info=True)


# ============================================================================
# Helpers
# ============================================================================

def _friendly_method(method: str, ptype: str) -> str:
    labels = {
        "credit_card":   "Tarjeta de credito",
        "debit_card":    "Tarjeta de debito",
        "account_money": "Dinero en cuenta MP",
        "ticket":        "Pago en efectivo",
        "bank_transfer": "Transferencia bancaria",
        "atm":           "Cajero automatico",
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


def _support_email_clean(support_email: str) -> str:
    """Extrae solo el email de un string tipo 'Nombre <email@x.com>'"""
    import re
    m = re.search(r'<(.+?)>', support_email)
    return m.group(1) if m else support_email


def _build_plain_text(*, user, course, payment_id, preference_id, order_id,
                      amount, currency, approved_at, payment_method,
                      installments, course_url, support_email) -> str:
    lines = [
        f"Hola {user.first_name},",
        "",
        "Tu pago fue confirmado con exito!",
        f"Ya tenes acceso completo a: {course.title}",
        "",
        "--- DETALLE DE LA ORDEN ---",
        f"  Curso          : {course.title}",
        f"  Monto abonado  : {_format_amount(amount, currency)}",
        f"  Metodo de pago : {payment_method}",
        *([ f"  Cuotas         : {installments}"] if installments > 1 else []),
        f"  Fecha aprobado : {_format_date(approved_at)}",
        "",
        "--- COMPROBANTE MERCADO PAGO ---",
        f"  ID de pago     : {payment_id}",
        f"  ID de orden    : {order_id}",
        f"  Referencia     : {preference_id}",
        "----------------------------------",
        "",
    ]
    if course_url:
        lines += [f"Accede a tu curso aqui: {course_url}", ""]
    lines += [
        f"Ante cualquier consulta escribinos a {_support_email_clean(support_email)}",
        "",
        "Muchas gracias por tu compra!",
        "El equipo de Tejiendo con Andy",
    ]
    return "\n".join(lines)


def _build_html(*, user, course, payment_id, preference_id, order_id,
                amount, currency, approved_at, payment_method,
                installments, course_url, support_email) -> str:

    amount_str       = _format_amount(amount, currency)
    date_str         = _format_date(approved_at)
    clean_email      = _support_email_clean(support_email)

    cuotas_row = ""
    if installments and installments > 1:
        cuotas_row = (
            "<tr>"
            '<td class="label">Cuotas</td>'
            f'<td class="value">{installments} cuotas</td>'
            "</tr>"
        )

    cta_block = ""
    if course_url:
        cta_block = (
            '<div style="text-align:center;margin:36px 0 8px;">'
            f'<a href="{course_url}" class="btn">Ir a mi curso &rarr;</a>'
            "</div>"
        )

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Pago confirmado - Tejiendo con Andy</title>
<style>
body,table,td,a{{margin:0;padding:0;border:0;font-size:100%;}}
body{{
  background-color:#ffeee5;
  font-family:Arial,sans-serif;
  color:#2d2d2d;
}}
.wrapper{{
  max-width:600px;
  margin:32px auto;
  background:#ffffff;
  border-radius:16px;
  overflow:hidden;
  box-shadow:0 8px 32px rgba(252,92,13,0.12);
}}
.header{{
  background:linear-gradient(135deg,#fc5c0d 0%,#fe6308 60%,#ff8a4c 100%);
  padding:44px 48px 36px;
  text-align:center;
}}
.brand{{
  font-size:12px;
  font-weight:700;
  letter-spacing:.18em;
  text-transform:uppercase;
  color:rgba(255,255,255,0.85);
  margin-bottom:20px;
}}
.check-circle{{
  display:inline-block;
  width:64px;
  height:64px;
  background:rgba(255,255,255,0.18);
  border:2px solid rgba(255,255,255,0.55);
  border-radius:50%;
  line-height:64px;
  font-size:28px;
  text-align:center;
  margin-bottom:18px;
}}
.header h1{{
  font-size:26px;
  font-weight:700;
  color:#ffffff;
  margin:0 0 6px;
  line-height:1.3;
}}
.tagline{{
  color:rgba(255,255,255,0.88);
  font-size:14px;
  margin:0;
}}
.body{{padding:40px 48px 32px;}}
.greeting{{
  font-size:20px;
  font-weight:700;
  color:#1a1a1a;
  margin:0 0 10px;
}}
.intro{{
  font-size:15px;
  color:#4a4a4a;
  line-height:1.75;
  margin:0 0 28px;
}}
.course-card{{
  background:linear-gradient(135deg,#fff5f0,#ffeee5);
  border:1.5px solid #fc5c0d;
  border-radius:12px;
  padding:20px 24px;
  margin-bottom:32px;
}}
.course-eyebrow{{
  font-size:11px;
  font-weight:700;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:#fc5c0d;
  margin-bottom:6px;
}}
.course-name{{
  font-size:19px;
  font-weight:700;
  color:#1a1a1a;
  line-height:1.3;
}}
.section-title{{
  font-size:11px;
  font-weight:700;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:#fc5c0d;
  margin:0 0 14px;
  display:block;
}}
table.detail{{width:100%;border-collapse:collapse;margin-bottom:28px;}}
table.detail td{{
  padding:12px 0;
  font-size:14px;
  border-bottom:1px solid #ffeee5;
  vertical-align:top;
}}
table.detail td.label{{color:#6b6b6b;width:44%;}}
table.detail td.value{{color:#1a1a1a;font-weight:600;text-align:right;}}
.mp-block{{
  background:#fff5f0;
  border-radius:12px;
  border:1px solid #ffd6c0;
  padding:20px 24px;
  margin-bottom:32px;
}}
.mp-title{{
  font-size:11px;
  font-weight:700;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:#fc5c0d;
  margin-bottom:14px;
}}
.mp-row{{
  font-size:13px;
  margin-bottom:8px;
  overflow:hidden;
}}
.mp-key{{color:#6b6b6b;float:left;}}
.mp-val{{
  color:#2d2d2d;
  font-family:'Courier New',Courier,monospace;
  font-size:12px;
  font-weight:700;
  float:right;
  text-align:right;
  max-width:60%;
  word-break:break-all;
}}
.divider{{border:none;border-top:1.5px solid #ffeee5;margin:0 0 28px;}}
.btn{{
  display:inline-block;
  background:#fc5c0d;
  color:#ffffff !important;
  text-decoration:none;
  padding:16px 40px;
  border-radius:50px;
  font-size:15px;
  font-weight:700;
  letter-spacing:.03em;
}}
.footer{{
  background:#fff5f0;
  border-top:1.5px solid #ffd6c0;
  padding:24px 48px 28px;
  text-align:center;
}}
.footer-yarn{{font-size:24px;margin-bottom:8px;}}
.footer p{{font-size:12px;color:#6b6b6b;line-height:1.7;margin:0;}}
.footer a{{color:#fc5c0d;text-decoration:none;font-weight:600;}}
</style>
</head>
<body>
<div class="wrapper">

  <div class="header">
    <div class="brand">Tejiendo con Andy &#129524;</div>
    <div class="check-circle">&#10003;</div>
    <h1>&#x00a1;Pago confirmado!</h1>
    <p class="tagline">Tu acceso al curso est&#225; listo</p>
  </div>

  <div class="body">
    <p class="greeting">Hola, {user.first_name} &#x1F44B;</p>
    <p class="intro">
      &#x00a1;Qu&#233; alegr&#237;a tenerte con nosotras! Tu compra fue procesada con &#233;xito
      y ya pod&#233;s comenzar a tejer. Guard&#225; este correo como comprobante de tu orden.
    </p>

    <div class="course-card">
      <div class="course-eyebrow">Curso adquirido</div>
      <div class="course-name">{course.title}</div>
    </div>

    <span class="section-title">Detalle del pago</span>
    <table class="detail">
      <tr>
        <td class="label">Monto abonado</td>
        <td class="value">{amount_str}</td>
      </tr>
      <tr>
        <td class="label">M&#233;todo de pago</td>
        <td class="value">{payment_method}</td>
      </tr>
      {cuotas_row}
      <tr>
        <td class="label">Fecha de aprobaci&#243;n</td>
        <td class="value">{date_str}</td>
      </tr>
    </table>

    <div class="mp-block">
      <div class="mp-title">Comprobante Mercado Pago</div>
      <div class="mp-row">
        <span class="mp-key">ID de pago</span>
        <span class="mp-val">{payment_id}</span>
      </div>
      <div style="clear:both;"></div>
      <div class="mp-row">
        <span class="mp-key">ID de orden</span>
        <span class="mp-val">{order_id}</span>
      </div>
      <div style="clear:both;"></div>
      <div class="mp-row">
        <span class="mp-key">Referencia</span>
        <span class="mp-val">{preference_id}</span>
      </div>
      <div style="clear:both;"></div>
    </div>

    <hr class="divider">
    {cta_block}
  </div>

  <div class="footer">
    <div class="footer-yarn">&#129524;</div>
    <p>
      &#x00bf;Ten&#233;s alguna duda? Escrib&#237;nos a
      <a href="mailto:{clean_email}">{clean_email}</a>.<br>
      Con mucho amor, el equipo de <strong>Tejiendo con Andy</strong>.
    </p>
  </div>

</div>
</body>
</html>"""