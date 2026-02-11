import api from './axios';

export const paymentsAPI = {
  createPayment: async (courseId) => {
    const response = await api.post('/payments/create/', { course_id: courseId });
    return response.data;
  },

  // Cambiar el nombre para que coincida
  checkPreferenceStatus: async (preferenceId) => {
    const response = await api.get(`/payments/check-preference/${preferenceId}/`);
    return response.data;
  },

  getPaymentStatus: async (paymentId) => {
    const response = await api.get(`/payments/status/${paymentId}/`);
    return response.data;
  },

  getTransactions: async () => {
    const response = await api.get('/payments/transactions/');
    return response.data;
  },

  getMyCourses: async () => {
    const response = await api.get('/payments/my-courses/');
    return response.data;
  }
};