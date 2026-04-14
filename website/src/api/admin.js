import api from './axios';

const BASE = '/analytics';

export const adminApi = {
  // Dashboard
  getDashboard: () => api.get(`${BASE}/dashboard/`),
  getRevenue: (params = {}) => api.get(`${BASE}/revenue/`, { params }),
  getUserAnalytics: (params = {}) => api.get(`${BASE}/users/`, { params }),
  getOrderAnalytics: (params = {}) => api.get(`${BASE}/orders/`, { params }),
  getSupportAnalytics: (params = {}) => api.get(`${BASE}/support/`, { params }),
  getRecentActivity: (params = {}) => api.get(`${BASE}/activity/`, { params }),
  getSnapshots: (params = {}) => api.get(`${BASE}/snapshots/`, { params }),

  // Page view tracking
  trackPageView: (path, referrer) => api.post(`${BASE}/track/`, { path, referrer }),

  // User management
  getUsers: (params = {}) => api.get(`${BASE}/admin/users/`, { params }),
  getUser: (id) => api.get(`${BASE}/admin/users/${id}/`),
  updateUser: (id, data) => api.patch(`${BASE}/admin/users/${id}/`, data),

  // Products (backend uses slug for lookups)
  getAdminProducts: (params) => api.get('/shop/admin/products/', { params }),
  createProduct: (data) => api.post('/shop/admin/products/create/', data),
  updateProduct: (slug, data) => api.patch(`/shop/admin/products/${slug}/`, data),
  deleteProduct: (slug) => api.delete(`/shop/admin/products/${slug}/delete/`),
  uploadProductImage: (slug, formData) => api.post(`/shop/admin/products/${slug}/images/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProductImage: (slug, imageId) => api.delete(`/shop/admin/products/${slug}/images/${imageId}/delete/`),
  setProductImagePrimary: (slug, imageId) => api.post(`/shop/admin/products/${slug}/images/${imageId}/set-primary/`),

  // Blog (backend uses slug for lookups)
  getAdminBlogPosts: (params) => api.get('/blog/admin/posts/', { params }),
  getBlogPost: (slug) => api.get(`/blog/admin/posts/${slug}/`),
  createBlogPost: (data) => api.post('/blog/admin/posts/create/', data),
  updateBlogPost: (slug, data) => api.patch(`/blog/admin/posts/${slug}/`, data),
  deleteBlogPost: (slug) => api.delete(`/blog/admin/posts/${slug}/delete/`),
  getBlogCategories: () => api.get('/blog/admin/categories/'),
  createBlogCategory: (data) => api.post('/blog/admin/categories/', data),

  // Packages (backend uses slug for lookups)
  getAdminPackages: (params) => api.get('/solar-config/admin/packages/', { params }),
  createPackage: (data) => api.post('/solar-config/admin/packages/create/', data),
  updatePackage: (slug, data) => api.patch(`/solar-config/admin/packages/${slug}/`, data),
  deletePackage: (slug) => api.delete(`/solar-config/admin/packages/${slug}/delete/`),

  // Package items (components within a package)
  getPackageItems: (slug) => api.get(`/solar-config/admin/packages/${slug}/items/`),
  addPackageItem: (slug, data) => api.post(`/solar-config/admin/packages/${slug}/items/`, data),
  updatePackageItem: (slug, itemId, data) => api.patch(`/solar-config/admin/packages/${slug}/items/${itemId}/`, data),
  removePackageItem: (slug, itemId) => api.delete(`/solar-config/admin/packages/${slug}/items/${itemId}/`),
  recalculatePackage: (slug, data) => api.post(`/solar-config/admin/packages/${slug}/recalculate/`, data),

  // Solar components & families (for dropdowns)
  getAdminComponents: (params) => api.get('/solar-config/admin/components/', { params }),
  getAdminFamilies: (params) => api.get('/solar-config/admin/families/', { params }),

  // Instant quotes & Solar Advisor tracking
  getInstantQuotes: (params) => api.get('/solar-config/admin/instant-quotes/', { params }),
  getInstantQuoteDetail: (id) => api.get(`/solar-config/admin/instant-quotes/${id}/`),
  getAdvisorSessions: (params) => api.get('/solar-config/admin/advisor-sessions/', { params }),
  getAdvisorSessionDetail: (id) => api.get(`/solar-config/admin/advisor-sessions/${id}/`),

  // Quotation Requests
  getQuotationRequests: (params) => api.get('/quotations/admin/requests/', { params }),
  getQuotationRequestDetail: (id) => api.get(`/quotations/admin/requests/${id}/`),

  // Media
  getMedia: (params) => api.get('/shop/admin/media/', { params }),
  uploadMedia: (formData) => api.post('/shop/admin/media/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteMedia: (imageId) => api.delete(`/shop/admin/media/${imageId}/delete/`),

  // Categories & Brands (for product form dropdowns)
  getCategories: () => api.get('/shop/categories/'),
  getBrands: () => api.get('/shop/brands/'),
};
