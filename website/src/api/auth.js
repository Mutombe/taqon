import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register/', data),

  login: (data) => api.post('/auth/login/', data),

  logout: (refresh) => api.post('/auth/logout/', { refresh }),

  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),

  verifyEmail: (token) => api.post('/auth/verify-email/', { token }),

  requestPasswordReset: (email) => api.post('/auth/password-reset/', { email }),

  confirmPasswordReset: (data) => api.post('/auth/password-reset/confirm/', data),

  changePassword: (data) => api.post('/auth/password-change/', data),

  getProfile: () => api.get('/auth/me/'),

  updateProfile: (data) => api.patch('/auth/me/', data),

  uploadAvatar: (formData) =>
    api.patch('/auth/me/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteAccount: () => api.delete('/auth/me/delete/'),

  // Google OAuth
  googleLogin: () => api.get('/auth/google/'),
  googleTokenLogin: (credential) => api.post('/auth/google/token/', { credential }),

  // Account summary
  getSummary: () => api.get('/auth/me/summary/'),

  // Saved addresses
  getAddresses: () => api.get('/auth/me/addresses/'),
  createAddress: (data) => api.post('/auth/me/addresses/', data),
  updateAddress: (id, data) => api.patch(`/auth/me/addresses/${id}/`, data),
  deleteAddress: (id) => api.delete(`/auth/me/addresses/${id}/`),
  setDefaultAddress: (id) => api.post(`/auth/me/addresses/${id}/default/`),
};
