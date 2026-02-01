import { useState } from 'react';
import { paymentsAPI } from '../api/payments';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createPayment = async (courseId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentsAPI.createPayment(courseId);
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.error || 'Error al crear el pago';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { createPayment, loading, error };
};