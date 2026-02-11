# Pruebas de pago con Mercado Pago (Sandbox)

Según la [documentación oficial](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test/test-purchases), las compras de prueba deben hacerse con la **cuenta de prueba comprador** de tu aplicación.

## 1. Credenciales del vendedor (tu backend)

- En [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app) → tu aplicación → **Credenciales**.
- Usá **Credenciales de prueba** (no Producción).
- En el `.env` del backend, `MERCADOPAGO_ACCESS_TOKEN` debe ser el **Access Token de prueba**.

## 2. Cuenta de prueba comprador (obligatoria para que el pago no falle)

La app tiene una **cuenta de prueba comprador** asociada. Sin usarla, el sandbox puede rechazar el pago (“Algo salió mal”).

1. Entrá a [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app) → tu aplicación.
2. En el menú izquierdo: **Cuentas de prueba**.
3. Elegí **Comprador**. Ahí vas a ver:
   - **País**
   - **User ID**
   - **Usuario** (email)
   - **Contraseña**

Anotá usuario y contraseña. Si MP pide un código por email al iniciar sesión, usá los **últimos 6 dígitos del User ID** de esa cuenta comprador.

## 3. Cómo hacer una compra de prueba (pago aprobado)

1. Abrí una **ventana de incógnito** (evita conflictos con otras sesiones).
2. Entrá a tu tienda (ej. `http://localhost:5173`), elegí un curso y hacé clic en **Pagar**.
3. Cuando se abra el checkout de Mercado Pago (sandbox):
   - **Iniciá sesión con la cuenta de prueba comprador** (el usuario y contraseña del paso 2).  
     Sin este paso, el sandbox suele devolver “No pudimos procesar tu pago”.
4. Después de entrar, elegí **“Tarjeta”** o **“Otro medio de pago”** → **Tarjeta**.
5. Completá con datos de prueba:
   - **Número:** `5031 7557 3453 0604` (Mastercard)
   - **CVV:** `123`
   - **Vencimiento:** `11/30`
   - **Nombre y apellido del titular:** `APRO` (tal cual, en mayúsculas)
   - **Documento (DNI):** `12345678`
6. Confirmá el pago.

Si todo está bien, deberías ver la pantalla de éxito del pago de prueba.

## 4. Resumen

| Qué | Dónde |
|-----|--------|
| Access Token de **prueba** (vendedor) | Credenciales de prueba → en `.env` como `MERCADOPAGO_ACCESS_TOKEN` |
| Cuenta **comprador** de prueba | Cuentas de prueba → Comprador → Usuario + Contraseña |
| Iniciar sesión en el checkout | Con el usuario/contraseña del comprador antes de pagar con tarjeta |
| Nombre del titular para aprobar | `APRO` |
| DNI (para APRO) | `12345678` |

## 5. Si sigue fallando

- Confirmá que en la terminal del backend aparece `[MP] Checkout URL: sandbox=True`.
- Verificá que el curso tenga **precio > 0** en el admin.
- Probá siempre en **incógnito** y **logueado en el checkout con la cuenta comprador**.
- Si MP pide código por email, usá los **últimos 6 dígitos del User ID** de la cuenta comprador (en Cuentas de prueba).
- Consultá la [guía oficial de compras de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test/test-purchases) o el [centro de ayuda](https://www.mercadopago.com.ar/developers/es/support/center) de MP.
