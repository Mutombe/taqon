import api from './axios';

const BASE = '/feature-flags';

export const featureFlagsApi = {
  // Public — resolved per-request, used by the gating layer
  get: () => api.get(`${BASE}/`),

  // Admin
  adminList: () => api.get(`${BASE}/admin/`),
  adminUpdate: (key, payload) => api.patch(`${BASE}/admin/${key}/`, payload),
};
