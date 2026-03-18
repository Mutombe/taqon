import api from './axios';

const BASE = '/solar-config';

export const solarConfigApi = {
  // Components (public)
  getComponents: (params = {}) => api.get(`${BASE}/components/`, { params }),
  getComponentDetail: (slug) => api.get(`${BASE}/components/${slug}/`),
  getComponentCategories: () => api.get(`${BASE}/components/categories/`),

  // Packages (public)
  getPackages: (params = {}) => api.get(`${BASE}/packages/`, { params }),
  getPackageDetail: (slug) => api.get(`${BASE}/packages/${slug}/`),

  // Package Families (public)
  getFamilies: () => api.get(`${BASE}/families/`),
  getFamilyDetail: (slug) => api.get(`${BASE}/families/${slug}/`),

  // Appliances (public)
  getAppliances: (params = {}) => api.get(`${BASE}/appliances/`, { params }),
  getApplianceCategories: () => api.get(`${BASE}/appliances/categories/`),

  // Recommendation Engine (public)
  getRecommendation: (data) => api.post(`${BASE}/recommend/`, data),
  getInstantQuote: (data) => api.post(`${BASE}/instant-quote/`, data, { responseType: 'blob' }),

  // Package Price Calculator (public)
  getPackagePrice: (slug, params = {}) => api.get(`${BASE}/packages/${slug}/price/`, { params }),

  // Configurations (authenticated)
  getConfigurations: () => api.get(`${BASE}/configurations/`),
  getConfiguration: (id) => api.get(`${BASE}/configurations/${id}/`),
  createConfiguration: (data) => api.post(`${BASE}/configurations/create/`, data),
  updateConfiguration: (id, data) => api.patch(`${BASE}/configurations/${id}/update/`, data),
  deleteConfiguration: (id) => api.delete(`${BASE}/configurations/${id}/delete/`),

  // Configuration items
  replaceItems: (id, items) => api.put(`${BASE}/configurations/${id}/items/`, { items }),
  addItem: (id, data) => api.post(`${BASE}/configurations/${id}/items/add/`, data),
  updateItemQuantity: (id, itemId, quantity) => api.patch(`${BASE}/configurations/${id}/items/${itemId}/`, { quantity }),
  removeItem: (id, itemId) => api.delete(`${BASE}/configurations/${id}/items/${itemId}/remove/`),

  // Actions
  duplicateConfiguration: (id) => api.post(`${BASE}/configurations/${id}/duplicate/`),
  convertToQuote: (id) => api.post(`${BASE}/configurations/${id}/convert-to-quote/`),
};
