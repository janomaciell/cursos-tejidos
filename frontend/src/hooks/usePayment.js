import { useState, useRef } from 'react';
import { paymentsAPI } from '../api/payments';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);

  /**
   * Hacer polling del estado de pago consultando el backend
   * que a su vez consulta a Mercado Pago
   */
  const pollPaymentStatus = async (preferenceId, maxAttempts = 40) => {
    return new Promise((resolve) => {
      let attempts = 0;

      pollingIntervalRef.current = setInterval(async () => {
        attempts++;

        console.log(`[Polling ${attempts}/${maxAttempts}] Consultando estado del pago...`);

        try {
          // Consultar el estado de la preferencia
          const data = await paymentsAPI.checkPreferenceStatus(preferenceId);

          console.log('[Polling] Estado actual:', data.status);

          if (data.status === 'approved') {
            clearInterval(pollingIntervalRef.current);
            resolve({ success: true, status: 'approved', data });
          } else if (data.status === 'rejected') {
            clearInterval(pollingIntervalRef.current);
            resolve({ success: false, status: 'rejected', data });
          } else if (data.status === 'cancelled') {
            clearInterval(pollingIntervalRef.current);
            resolve({ success: false, status: 'cancelled', data });
          }
          // Si es 'pending', seguir haciendo polling

          if (attempts >= maxAttempts) {
            console.log('[Polling] Timeout alcanzado');
            clearInterval(pollingIntervalRef.current);
            resolve({ success: false, status: 'timeout' });
          }
        } catch (err) {
          console.error('[Polling] Error:', err);
          // Continuar el polling aunque haya un error
        }
      }, 3000); // Cada 3 segundos
    });
  };

  const createPayment = async (courseId, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Crear la preferencia de pago en el backend
      const paymentData = await paymentsAPI.createPayment(courseId);

      console.log('[Payment] Preferencia creada:', paymentData);

      // 2. Abrir Mercado Pago — usar siempre el init_point de producción
      let paymentUrl = paymentData.init_point || paymentData.sandbox_init_point;

      if (options.openInPopup) {
        // Abrir en popup
        const paymentWindow = window.open(
          paymentUrl,
          'MercadoPago',
          'width=800,height=600,scrollbars=yes'
        );

        if (!paymentWindow) {
          throw new Error('El popup fue bloqueado. Por favor permite popups para este sitio.');
        }

        // 3. Iniciar polling mientras el usuario completa el pago
        const result = await pollPaymentStatus(paymentData.preference_id);

        // 4. Cerrar popup si sigue abierto
        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.close();
        }

        return {
          success: result.success,
          status: result.status,
          data: result.data || paymentData
        };
      } else {
        // Redirigir en la misma ventana
        // Guardar preference_id en localStorage para poder hacer polling al volver
        localStorage.setItem('pending_payment_preference_id', paymentData.preference_id);
        window.location.href = paymentUrl;

        return { success: true, data: paymentData };
      }

    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error al crear el pago';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verificar si hay un pago pendiente (útil después de volver de MP)
   */
  const checkPendingPayment = async () => {
    const preferenceId = localStorage.getItem('pending_payment_preference_id');

    if (!preferenceId) {
      return null;
    }

    try {
      const data = await paymentsAPI.checkPreferenceStatus(preferenceId);

      // Si ya se procesó, limpiar localStorage
      if (data.status !== 'pending') {
        localStorage.removeItem('pending_payment_preference_id');
      }

      return data;
    } catch (err) {
      console.error('[Payment] Error checking pending payment:', err);
      return null;
    }
  };

  /**
   * Cancelar el polling en caso de que el usuario cierre el componente
   */
  const cancelPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  return {
    createPayment,
    checkPendingPayment,
    cancelPolling,
    loading,
    error
  };
};