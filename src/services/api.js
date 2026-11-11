import axios from 'axios';
import { shouldRedirectOnUnauthorized } from '../utils/format';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.iaimiftahululum.com/api', // Pointing to Laravel API (from env)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request Interceptor: Attach token if exists & handle FormData multipart boundary
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iaimu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    // Clear local storage and redirect to login if token is invalid/expired
    localStorage.removeItem('iaimu_token');
    localStorage.removeItem('iaimu_user');
    if (typeof window !== 'undefined' && shouldRedirectOnUnauthorized(window.location.pathname)) {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default api;
