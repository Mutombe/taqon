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
  googleLogin: (next) => {
    // Pass the caller's origin as redirect_uri so the backend builds a Google
    // URL that actually matches the domain the user is on (taqon.co.zw vs
    // taqon.onrender.com). That domain must ALSO be registered in Google
    // Cloud Console under Authorized Redirect URIs or Google will return
    // "Error 400: redirect_uri_mismatch".
    const redirect_uri = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/google/callback`
      : undefined;
    const params = {};
    if (next) params.next = next;
    if (redirect_uri) params.redirect_uri = redirect_uri;
    return api.get('/auth/google/', { params });
  },
  googleCodeExchange: (code, redirect_uri) => api.post('/auth/google/exchange/', { code, redirect_uri }),
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
