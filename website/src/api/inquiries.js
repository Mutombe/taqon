import api from './axios';

const BASE = '/inquiries';

export const inquiriesApi = {
  // Public — submit a new inquiry
  submit: (data) => api.post(`${BASE}/`, data),

  // Admin
  adminList: (params = {}) => api.get(`${BASE}/admin/`, { params }),
  adminDetail: (id) => api.get(`${BASE}/admin/${id}/`),
  adminUpdate: (id, payload) => api.patch(`${BASE}/admin/${id}/`, payload),
};
