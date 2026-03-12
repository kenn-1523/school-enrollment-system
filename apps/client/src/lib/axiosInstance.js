/**
 * CENTRALIZED AXIOS INSTANCE
 * 
 * This is the single source of truth for all API communication.
 * All services should import this instance instead of creating their own.
 * 
 * Features:
 * - Centralized baseURL management (uses NEXT_PUBLIC_API_URL env var)
 * - Automatic JWT Authorization header injection
 * - Consistent timeout and error handling
 * - CORS-ready configuration
 */

import axios from 'axios';

// ==========================================
// 1) CONFIGURATION
// ==========================================
const API_ROOT = process.env.NEXT_PUBLIC_API_URL || 'https://school-enrollment-system.onrender.com';
const API_BASE_URL = `${API_ROOT}/api`;

// ==========================================
// 2) CREATE AXIOS INSTANCE
// ==========================================
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: false, // JWT header auth only; no cookies needed
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ==========================================
// 3) REQUEST INTERCEPTOR - Add JWT Token
// ==========================================
axiosInstance.interceptors.request.use(
  (config) => {
    // Only run in browser (check for window object)
    if (typeof window === 'undefined') return config;

    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (token) {
      // Add Authorization header with Bearer token
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request error
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ==========================================
// 4) RESPONSE INTERCEPTOR - Handle Errors
// ==========================================
axiosInstance.interceptors.response.use(
  (response) => {
    // If successful, return response
    return response;
  },
  (error) => {
    // Handle response error
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        // Unauthorized - clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response (network error)
      console.error('Network error:', error.request);
    } else {
      // Error in request setup
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
