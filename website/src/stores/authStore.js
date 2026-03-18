import { create } from 'zustand';
import { authApi } from '../api/auth';

const getStoredTokens = () => {
  try {
    return JSON.parse(localStorage.getItem('taqon-tokens')) || null;
  } catch {
    return null;
  }
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('taqon-user')) || null;
  } catch {
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  tokens: getStoredTokens(),
  isAuthenticated: !!getStoredTokens()?.access,
  isLoading: false,
  error: null,

  // Auth modal state
  isAuthModalOpen: false,
  authModalView: 'login', // 'login' | 'register' | 'forgot-password'

  setAuth: (user, tokens) => {
    localStorage.setItem('taqon-user', JSON.stringify(user));
    localStorage.setItem('taqon-tokens', JSON.stringify(tokens));
    set({ user, tokens, isAuthenticated: true, error: null });
  },

  clearAuth: () => {
    localStorage.removeItem('taqon-user');
    localStorage.removeItem('taqon-tokens');
    set({ user: null, tokens: null, isAuthenticated: false, error: null });
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      const { user, tokens } = response.data;
      get().setAuth(user, tokens);
      return response.data;
    } catch (error) {
      const msg =
        error.response?.data?.details || error.response?.data?.error || 'Registration failed.';
      set({ error: msg, isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      const { user, tokens } = response.data;
      get().setAuth(user, tokens);
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || 'Invalid email or password.';
      set({ error: msg, isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      const tokens = get().tokens;
      if (tokens?.refresh) {
        await authApi.logout(tokens.refresh);
      }
    } catch {
      // Logout even if API call fails
    } finally {
      get().clearAuth();
    }
  },

  fetchProfile: async () => {
    try {
      const response = await authApi.getProfile();
      const user = response.data;
      localStorage.setItem('taqon-user', JSON.stringify(user));
      set({ user });
      return user;
    } catch (error) {
      if (error.response?.status === 401) {
        get().clearAuth();
      }
      throw error;
    }
  },

  updateProfile: async (data) => {
    const response = await authApi.updateProfile(data);
    const user = response.data;
    localStorage.setItem('taqon-user', JSON.stringify(user));
    set({ user });
    return user;
  },

  clearError: () => set({ error: null }),

  openAuthModal: (view = 'login') =>
    set({ isAuthModalOpen: true, authModalView: view, error: null }),

  closeAuthModal: () =>
    set({ isAuthModalOpen: false, authModalView: 'login', error: null }),

  setAuthModalView: (view) =>
    set({ authModalView: view, error: null }),
}));

export default useAuthStore;
