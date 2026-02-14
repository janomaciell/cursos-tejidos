# Pruebas de pago con Mercado Pago

## Si "dinero en cuenta" funciona pero la tarjeta no

El backend no diferencia tarjeta vs dinero en cuenta: ambos usan la misma preferencia y Checkout Pro. Si un método funciona, el código está bien. El fallo con tarjeta suele ser:

1. **Credenciales de prueba**  
   En [Tus integraciones → Credenciales](https://www.mercadopago.com.ar/developers/panel/app) debes usar **Credenciales de prueba**, no las de producción. Con credenciales de producción las tarjetas de prueba son rechazadas.

2. **Datos del titular en el checkout**  
   En el formulario de tarjeta de Mercado Pago (en su página), el **nombre y documento** del titular definen el resultado del pago. Para que el pago sea **aprobado** debes usar exactamente:

   | Campo              | Valor para pago aprobado |
   |--------------------|---------------------------|
   | Nombre y apellido  | `APRO`                    |
   | Tipo de documento  | DNI                       |
   | Número de documento| `12345678`                |

   Si usas otro nombre (por ejemplo tu nombre real), MP puede devolver rechazado, pendiente, etc.

3. **Tarjetas de prueba (Argentina)**  
   Número, CVV y vencimiento pueden ser cualquiera de estas (mismo resultado con el titular correcto):

   | Tipo   | Bandeira   | Número                | CVV  | Vencimiento |
   |--------|------------|------------------------|------|-------------|
   | Crédito| Mastercard | 5031 7557 3453 0604    | 123  | 11/30       |
   | Crédito| Visa       | 4509 9535 6623 3704    | 123  | 11/30       |
   | Crédito| Amex       | 3711 803032 57522      | 1234 | 11/30       |
   | Débito | Mastercard | 5287 3383 1025 3304    | 123  | 11/30       |
   | Débito | Visa       | 4002 7686 9439 5619    | 123  | 11/30       |

   Fuente: [Tarjetas de prueba - Mercado Pago Developers](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/cards)

## Pantalla de aviso de ngrok al volver de Mercado Pago

Si usás el frontend con URL de ngrok (ej. `https://xxx.ngrok-free.app`) y Mercado Pago redirige a `/payment-success`, ngrok muestra una página de advertencia **"You are about to visit..."** porque el redirect de MP no envía el header `ngrok-skip-browser-warning`.

**Qué hacer:** hacé clic en **"Visit Site"**. Ngrok muestra esa pantalla solo una vez por navegador; después cargará tu app directo y el pago se sincronizará en `/payment-success`.

**Para no ver la pantalla en desarrollo:** usá el frontend en localhost y solo ngrok para el backend (webhook). En el `.env` del backend poné `FRONTEND_URL=http://localhost:5173` y abrí la app en `http://localhost:5173`. Mercado Pago redirigirá a localhost y no pasás por la pantalla de ngrok. La API puede seguir siendo la URL de ngrok en el `.env` del frontend (`VITE_API_URL`).

## Resumen rápido

- Usar **Credenciales de prueba** en el panel de MP.
- En el checkout de MP, al pagar con tarjeta: **Nombre `APRO`**, **DNI `12345678`**.
- Número/CVV/vencimiento: cualquiera de la tabla de arriba.
- Si ves la pantalla de ngrok al volver del pago: clic en **"Visit Site"** (una sola vez).
