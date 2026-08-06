import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token to every outbound request
API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Response Interceptor: Handle global errors like 401 Unauthorized
API.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid authentication tokens/data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default API;