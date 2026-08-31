import api from './axios';

const BASE = '/downloads';

export const downloadsApi = {
  // Public — log a client-rendered (print-window) download
  track: (payload) => api.post(`${BASE}/track/`, payload).catch(() => undefined),

  // Public — company profile availability (drives show/hide of the download button)
  companyProfileMeta: () => api.get(`${BASE}/company-profile/`),

  // Admin
  adminList: (params = {}) => api.get(`${BASE}/admin/`, { params }),
  adminStats: () => api.get(`${BASE}/admin/stats/`),

  // Admin — company profile upload/replace
  getCompanyProfile: () => api.get(`${BASE}/admin/company-profile/`),
  uploadCompanyProfile: (formData) =>
    api.put(`${BASE}/admin/company-profile/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
