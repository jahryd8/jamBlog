// Uses Vite environment variable if available, otherwise defaults to local Express server
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Strip any trailing slash or trailing /api from the environment variable if present
export const API_BASE_URL = BASE.replace(/\/+$/, '').replace(/\/api$/, '');