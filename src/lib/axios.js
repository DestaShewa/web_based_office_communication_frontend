import axios from 'axios';
import useAuthStore from '../store/authStore';

import { API_URL } from './config';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Needed if relying on secure cookies or sessions
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Optionally grab the token from Zustand or localStorage here 
    // if not relying purely on HttpOnly cookies
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Auto-logout if unauthorized (token expired / invalid)
      const logout = useAuthStore.getState().logout;
      logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
