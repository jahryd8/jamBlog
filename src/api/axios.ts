import axios, { type InternalAxiosRequestConfig } from 'axios';

// Get URL and ensure no trailing slash
const rawBaseURL = import.meta.env.VITE_API_URL || 'https://jamblog.onrender.com';
const cleanedBaseURL = rawBaseURL.replace(/\/+$/, '');

const API = axios.create({
  baseURL: `${cleanedBaseURL}/api`, // Guarantees /api prefix and removes double slashes
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

export default API;