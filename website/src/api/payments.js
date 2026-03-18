import api from './axios';

export const paymentsApi = {
  // Initiate a payment for an order
  initiate: (data) => api.post('/payments/initiate/', data),

  // Verify/poll payment status
  verify: (reference) => api.post('/payments/verify/', { reference }),

  // Get payment details
  getPayment: (reference) => api.get(`/payments/${reference}/`),

  // Get payment history
  getHistory: (params) => api.get('/payments/history/', { params }),

  // Get all payments for a specific order
  getOrderPayments: (orderNumber) => api.get(`/payments/order/${orderNumber}/`),
};
