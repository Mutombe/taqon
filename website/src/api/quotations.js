import api from './axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const quotationsApi = {
  // Submit quote request (public — no auth needed)
  submitRequest: (data) => api.post('/quotations/request/', data),

  // My quote requests
  getMyRequests: (params) => api.get('/quotations/requests/mine/', { params }),
  getRequest: (id) => api.get(`/quotations/requests/${id}/`),

  // My quotations
  getMyQuotations: (params) => api.get('/quotations/mine/', { params }),
  getQuotation: (number) => api.get(`/quotations/${number}/`),
  respondToQuotation: (number, data) => api.post(`/quotations/${number}/respond/`, data),
  getQuotationPdfUrl: (number) => `${API_URL}/api/v1/quotations/${number}/pdf/`,

  // My invoices
  getMyInvoices: (params) => api.get('/quotations/invoices/mine/', { params }),
  getInvoice: (number) => api.get(`/quotations/invoices/${number}/`),

  // Invoice PDF download URL (direct link, uses auth token)
  getInvoicePdfUrl: (number) => `${API_URL}/api/v1/quotations/invoices/${number}/pdf/`,
};
