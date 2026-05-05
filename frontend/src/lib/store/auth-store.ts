import { create } from 'zustand';
import { User } from '../types';
import { api } from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User, token: string) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rs-token', token);
      localStorage.setItem('rs-user', JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  logout: async () => {
    try {
      // Call backend to revoke token if authenticated
      if (get().token) {
        await api.post('/auth/logout').catch(() => {});
      }
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rs-token');
        localStorage.removeItem('rs-user');
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
  setLoading: (loading) => set({ isLoading: loading }),
  fetchMe: async () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('rs-token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const res = await api.get('/auth/me');
      get().setUser(res.data.user, token);
    } catch (err) {
      get().logout();
    }
  },
}));

// Initialize from localStorage and validate with backend
if (typeof window !== 'undefined') {
  // First synchronously set from local storage to prevent flicker
  const token = localStorage.getItem('rs-token');
  const userStr = localStorage.getItem('rs-user');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      useAuthStore.getState().setUser(user, token);
    } catch {
      useAuthStore.getState().logout();
    }
  } else {
    useAuthStore.getState().setLoading(false);
  }

  // Then asynchronously validate token
  setTimeout(() => {
    useAuthStore.getState().fetchMe();
  }, 0);
}
