import { create } from 'zustand';
import apiClient from '../lib/axios';

// Helper to safely parse user from localStorage
const getInitialUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: getInitialUser(),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isPasswordWeak: localStorage.getItem('isPasswordWeak') === 'true',

  // Refresh user data from server
  checkAuth: async () => {
    try {
      const response = await apiClient.get('/users/me');
      const user = response.data.data.user;
      const isPasswordWeak = user.isPasswordWeak === true;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isPasswordWeak', String(isPasswordWeak));
      set({ user, isAuthenticated: true, isPasswordWeak });
      return user;
    } catch (err) {
      console.error('Check auth failed:', err);
      // If unauthorized, don't necessarily logout (could be transient)
      // but if 401, we might want to.
      if (err.response?.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('isPasswordWeak');
        set({ user: null, token: null, isAuthenticated: false, isPasswordWeak: false });
      }
      throw err;
    }
  },

  // Store credentials upon successful login
  setCredentials: (user, token, isPasswordWeak = false) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isPasswordWeak', String(isPasswordWeak));
    if (token) {
        localStorage.setItem('token', token);
    }
    set({ user, token, isAuthenticated: true, isPasswordWeak });
  },

  // Update user object only
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  // Update password strength status
  setPasswordStrength: (isWeak) => {
    localStorage.setItem('isPasswordWeak', String(isWeak));
    set({ isPasswordWeak: isWeak });
  },

  // Clear credentials on logout
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isPasswordWeak');
    set({ user: null, token: null, isAuthenticated: false, isPasswordWeak: false });
  },
}));

export default useAuthStore;
