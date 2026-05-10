import api from './axios';

const BASE = '/downloads';

export const downloadsApi = {
  // Public — log a client-rendered (print-window) download
  track: (payload) => api.post(`${BASE}/track/`, payload).catch(() => undefined),

  // Admin
  adminList: (params = {}) => api.get(`${BASE}/admin/`, { params }),
  adminStats: () => api.get(`${BASE}/admin/stats/`),
};
