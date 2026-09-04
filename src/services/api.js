import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Pointing to Laravel API
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request Interceptor: Attach token if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iaimu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export default api;
