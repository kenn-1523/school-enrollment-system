import axios from 'axios';

// Base URL for all API calls.  Do NOT include a trailing `/api` here;
// endpoints should start with `/api` when used (e.g. api.get('/api/me')).
export const API_BASE = 'https://school-enrollment-system.onrender.com';

export const api = axios.create({
  baseURL: API_BASE,
  // hostinger + render require no cookies; we only send auth header
  timeout: 30000,         // allow extra time for cold starts
  withCredentials: false, // JWT header auth only
});

// single request interceptor reads token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window === 'undefined') return config;
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);