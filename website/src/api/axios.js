import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let onAuthFailure = null;
export function setAuthFailureHandler(callback) {
  onAuthFailure = callback;
}

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem('taqon-tokens') || 'null');
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tokens = JSON.parse(localStorage.getItem('taqon-tokens') || 'null');

      if (!tokens?.refresh) {
        isRefreshing = false;
        localStorage.removeItem('taqon-tokens');
        localStorage.removeItem('taqon-user');
        if (onAuthFailure) onAuthFailure();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/api/v1/auth/token/refresh/`, {
          refresh: tokens.refresh,
        });
        const newTokens = { access: data.access, refresh: data.refresh || tokens.refresh };
        localStorage.setItem('taqon-tokens', JSON.stringify(newTokens));

        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
        processQueue(null, newTokens.access);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('taqon-tokens');
        localStorage.removeItem('taqon-user');
        if (onAuthFailure) onAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
