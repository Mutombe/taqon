import api from './axios';

const BASE = '/notifications';

export const notificationsApi = {
  // User
  getNotifications: (params = {}) => api.get(`${BASE}/`, { params }),
  getUnreadCount: () => api.get(`${BASE}/unread-count/`),
  markRead: (id) => api.patch(`${BASE}/${id}/read/`),
  markAllRead: () => api.post(`${BASE}/mark-all-read/`),
  deleteNotification: (id) => api.delete(`${BASE}/${id}/delete/`),
  clearRead: () => api.post(`${BASE}/clear-read/`),

  // Preferences
  getPreferences: () => api.get(`${BASE}/preferences/`),
  updatePreferences: (data) => api.patch(`${BASE}/preferences/`, data),
};
