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

  // Download receipt PDF (returns blob)
  downloadReceipt: (reference) => api.get(`/payments/${reference}/receipt/`, { responseType: 'blob' }),

  // Package deposits — customer
  initiateDeposit: (data) => api.post('/payments/deposits/initiate/', data),
  getMyDeposits: () => api.get('/payments/deposits/mine/'),
  getDeposit: (depositId) => api.get(`/payments/deposits/${depositId}/`),

  // Package deposits — admin
  adminListDeposits: (params) => api.get('/payments/admin/deposits/', { params }),
  adminGetDeposit: (depositId) => api.get(`/payments/admin/deposits/${depositId}/`),
  adminUpdateDeposit: (depositId, data) => api.patch(`/payments/admin/deposits/${depositId}/`, data),
};
