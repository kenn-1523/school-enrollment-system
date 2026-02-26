import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 20000,
});

// Attach JWT from localStorage when present (browser-only)
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      let token =
        localStorage.getItem('token') ||
        localStorage.getItem('adminToken') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('jwt');

      if (!token) {
        // Check stored user objects for embedded token
        const userJson = localStorage.getItem('user') || localStorage.getItem('student_user');
        try {
          const parsed = userJson ? JSON.parse(userJson) : null;
          if (parsed && parsed.token) token = parsed.token;
        } catch (e) {
          // ignore JSON parse errors
        }
      }

      if (token) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);