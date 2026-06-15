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
  getSidebarCounts: () => api.get(`${BASE}/sidebar-counts/`),
  getSnapshots: (params = {}) => api.get(`${BASE}/snapshots/`, { params }),

  // Page view tracking
  trackPageView: (path, referrer) => api.post(`${BASE}/track/`, { path, referrer }),

  // User management
  getUsers: (params = {}) => api.get(`${BASE}/admin/users/`, { params }),
  getUser: (id) => api.get(`${BASE}/admin/users/${id}/`),
  updateUser: (id, data) => api.patch(`${BASE}/admin/users/${id}/`, data),

  // Products (backend uses slug for lookups)
  getAdminProducts: (params) => api.get('/shop/admin/products/', { params }),
  getAdminProduct: (slug) => api.get(`/shop/admin/products/${slug}/`),
  createProduct: (data) => api.post('/shop/admin/products/create/', data),
  updateProduct: (slug, data) => api.patch(`/shop/admin/products/${slug}/`, data),
  duplicateProduct: (slug) => api.post(`/shop/admin/products/${slug}/duplicate/`),
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
  getAdminPackage: (slug) => api.get(`/solar-config/admin/packages/${slug}/`),
  createPackage: (data) => api.post('/solar-config/admin/packages/create/', data),
  updatePackage: (slug, data) => api.patch(`/solar-config/admin/packages/${slug}/`, data),
  deletePackage: (slug) => api.delete(`/solar-config/admin/packages/${slug}/delete/`),

  // Package items (components within a package)
  getPackageItems: (slug) => api.get(`/solar-config/admin/packages/${slug}/items/`),
  addPackageItem: (slug, data) => api.post(`/solar-config/admin/packages/${slug}/items/`, data),
  updatePackageItem: (slug, itemId, data) => api.patch(`/solar-config/admin/packages/${slug}/items/${itemId}/`, data),
  removePackageItem: (slug, itemId) => api.delete(`/solar-config/admin/packages/${slug}/items/${itemId}/`),
  recalculatePackage: (slug, data) => api.post(`/solar-config/admin/packages/${slug}/recalculate/`, data),
  getPackageChangelog: (slug, params) => api.get(`/solar-config/admin/packages/${slug}/changelog/`, { params }),
  revertPackageChange: (slug, logId) => api.post(`/solar-config/admin/packages/${slug}/changelog/${logId}/revert/`),

  // Geyser packages
  getGeyserPackages: (params) => api.get('/geysers/admin/packages/', { params }),
  createGeyserPackage: (data) => api.post('/geysers/admin/packages/', data),
  updateGeyserPackage: (slug, data) => api.patch(`/geysers/admin/packages/${slug}/`, data),
  deleteGeyserPackage: (slug) => api.delete(`/geysers/admin/packages/${slug}/`),

  // Solar components & families (for dropdowns)
  getAdminComponents: (params) => api.get('/solar-config/admin/components/', { params }),
  getAdminComponent: (slug) => api.get(`/solar-config/admin/components/${slug}/`),
  createComponent: (data) => api.post('/solar-config/admin/components/create/', data),
  updateComponent: (slug, data) => api.patch(`/solar-config/admin/components/${slug}/`, data),
  deleteComponent: (slug) => api.delete(`/solar-config/admin/components/${slug}/delete/`),
  getAdminFamilies: (params) => api.get('/solar-config/admin/families/', { params }),

  // Appliances (CRUD)
  getAdminAppliances: (params) => api.get('/solar-config/admin/appliances/', { params }),
  getAdminAppliance: (slug) => api.get(`/solar-config/admin/appliances/${slug}/`),
  createAppliance: (data) => api.post('/solar-config/admin/appliances/create/', data),
  updateAppliance: (slug, data) => api.patch(`/solar-config/admin/appliances/${slug}/`, data),
  deleteAppliance: (slug) => api.delete(`/solar-config/admin/appliances/${slug}/delete/`),

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
  deleteMedia: (itemId) => api.delete(`/shop/admin/media/${itemId}/delete/`),
  hideGalleryImage: (url) => api.post('/shop/admin/gallery/hide/', { url }),
  unhideGalleryImage: (url) => api.delete('/shop/admin/gallery/hide/', { data: { url } }),

  // Categories & Brands (for product form dropdowns)
  getCategories: () => api.get('/shop/categories/'),
  createCategory: (data) => api.post('/shop/admin/categories/', data),
  getBrands: () => api.get('/shop/brands/'),
  createBrand: (data) => api.post('/shop/admin/brands/', data),

  // ── Supplier inventory & pricing (admin-only) ──
  getInventorySummary: () => api.get('/inventory/summary/'),
  getMaterialCategories: () => api.get('/inventory/categories/'),
  createMaterialCategory: (data) => api.post('/inventory/categories/', data),
  updateMaterialCategory: (slug, data) => api.patch(`/inventory/categories/${slug}/`, data),
  deleteMaterialCategory: (slug) => api.delete(`/inventory/categories/${slug}/`),

  getSuppliers: (params) => api.get('/inventory/suppliers/', { params }),
  createSupplier: (data) => api.post('/inventory/suppliers/', data),
  updateSupplier: (slug, data) => api.patch(`/inventory/suppliers/${slug}/`, data),
  deleteSupplier: (slug) => api.delete(`/inventory/suppliers/${slug}/`),

  getMaterials: (params) => api.get('/inventory/materials/', { params }),
  getMaterial: (slug) => api.get(`/inventory/materials/${slug}/`),
  createMaterial: (data) => api.post('/inventory/materials/', data),
  updateMaterial: (slug, data) => api.patch(`/inventory/materials/${slug}/`, data),
  deleteMaterial: (slug) => api.delete(`/inventory/materials/${slug}/`),
  importMaterialFromProduct: (productId) => api.post('/inventory/materials/import-from-product/', { product_id: productId }),
  linkMaterialProduct: (slug, data) => api.post(`/inventory/materials/${slug}/link-product/`, data),
  syncMaterialPrice: (slug) => api.post(`/inventory/materials/${slug}/link-product/`, { sync_price: true }),
  unlinkMaterialProduct: (slug) => api.delete(`/inventory/materials/${slug}/link-product/`),

  setSupplierPrice: (data) => api.post('/inventory/prices/', data),
  batchPrices: (formData) => api.post('/inventory/prices/batch/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateSupplierPrice: (id, data) => api.patch(`/inventory/prices/${id}/`, data),
  deleteSupplierPrice: (id) => api.delete(`/inventory/prices/${id}/`),

  getPriceHistory: (params) => api.get('/inventory/price-history/', { params }),
  getInventoryAudit: (params) => api.get('/inventory/audit/', { params }),

  getQuotations: (params) => api.get('/inventory/quotations/', { params }),
  uploadQuotation: (formData) => api.post('/inventory/quotations/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteQuotation: (id) => api.delete(`/inventory/quotations/${id}/`),
};
