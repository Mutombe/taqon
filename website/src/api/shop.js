import api from './axios';

export const shopApi = {
  // Products
  getProducts: (params) => api.get('/shop/products/', { params }),
  getProduct: (slug) => api.get(`/shop/products/${slug}/`),
  getFeatured: () => api.get('/shop/products/featured/'),
  getOnSale: (params) => api.get('/shop/products/on-sale/', { params }),
  searchProducts: (q, params) => api.get('/shop/products/search/', { params: { q, ...params } }),
  getProductReviews: (slug, params) => api.get(`/shop/products/${slug}/reviews/`, { params }),
  createReview: (slug, data) => api.post(`/shop/products/${slug}/reviews/create/`, data),

  // Categories & Brands
  getCategories: () => api.get('/shop/categories/'),
  getCategory: (slug) => api.get(`/shop/categories/${slug}/`),
  getBrands: () => api.get('/shop/brands/'),
  getBrand: (slug) => api.get(`/shop/brands/${slug}/`),

  // Cart
  getCart: () => api.get('/shop/cart/'),
  addToCart: (product_id, quantity = 1) => api.post('/shop/cart/items/', { product_id, quantity }),
  updateCartItem: (id, quantity) => api.patch(`/shop/cart/items/${id}/`, { quantity }),
  removeCartItem: (id) => api.delete(`/shop/cart/items/${id}/remove/`),
  clearCart: () => api.delete('/shop/cart/clear/'),
  getCartSummary: () => api.get('/shop/cart/summary/'),
  mergeCart: () => api.post('/shop/cart/merge/'),

  // Wishlist
  getWishlist: () => api.get('/shop/wishlist/'),
  addToWishlist: (product_id) => api.post('/shop/wishlist/add/', { product_id }),
  removeFromWishlist: (productId) => api.delete(`/shop/wishlist/${productId}/`),
  moveToCart: (productId) => api.post(`/shop/wishlist/move-to-cart/${productId}/`),

  // Orders
  checkout: (data) => api.post('/shop/orders/checkout/', data),
  getOrders: (params) => api.get('/shop/orders/', { params }),
  getOrder: (orderNumber) => api.get(`/shop/orders/${orderNumber}/`),
  cancelOrder: (orderNumber) => api.post(`/shop/orders/${orderNumber}/cancel/`),
};
