import api from './axios';

const BASE = '/projects';

export const projectsApi = {
  // Public
  list: (params = {}) => api.get(`${BASE}/`, { params }),
  detail: (slug) => api.get(`${BASE}/${slug}/`),

  // Admin
  adminList: () => api.get(`${BASE}/admin/`),
  adminDetail: (slug) => api.get(`${BASE}/admin/${slug}/`),
  create: (payload) => api.post(`${BASE}/admin/`, payload),
  update: (slug, payload) => api.patch(`${BASE}/admin/${slug}/`, payload),
  remove: (slug) => api.delete(`${BASE}/admin/${slug}/`),
  addImage: (slug, formData) =>
    api.post(`${BASE}/admin/${slug}/images/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadHero: (slug, formData) =>
    api.post(`${BASE}/admin/${slug}/hero/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateImage: (id, payload) => api.patch(`${BASE}/admin/images/${id}/`, payload),
  deleteImage: (id) => api.delete(`${BASE}/admin/images/${id}/`),
};
