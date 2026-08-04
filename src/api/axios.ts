import axios, { type InternalAxiosRequestConfig } from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://jamblog.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default API