import axios from 'axios';

/**
 * ✅ WORKS LOCALLY + DEPLOYED (Best practice)
 *
 * Local (apps/client/.env.local):
 *   NEXT_PUBLIC_API_URL=http://localhost:3001
 *
 * Production (hosting env):
 *   NEXT_PUBLIC_API_URL=https://croupiertraining.sgwebworks.com
 *
 * If your production backend is under /backend_api (like your example),
 * set:
 *   NEXT_PUBLIC_API_URL=https://croupiertraining.sgwebworks.com/backend_api
 *
 * Then this file will call:
 *   {BASE}/api/admin/login
 *   {BASE}/api/student/login
 *   {BASE}/api/logout
 *
 * NOTE: uses cookies -> withCredentials: true
 */

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function normalizeBaseUrl(url) {
  if (!url) return '';
  // remove trailing slashes
  return url.replace(/\/+$/, '');
}

function buildApiBase(baseUrl) {
  // If baseUrl already ends with /api, keep it. Otherwise append /api
  const normalized = normalizeBaseUrl(baseUrl);
  if (!normalized) return '';
  if (normalized.endsWith('/api')) return normalized;
  return `${normalized}/api`;
}

const BASE_URL = normalizeBaseUrl(RAW_BASE_URL);
const API_URL = buildApiBase(BASE_URL);

// Optional: make axios a bit more stable / consistent
axios.defaults.withCredentials = true;

/**
 * Helper to format error consistently
 */
function toReadableError(error) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Server unreachable';

  return {
    message,
    status: error?.response?.status,
    data: error?.response?.data
  };
}

/**
 * 🔐 ADMIN LOGIN
 * Calls:
 *   {API_URL}/admin/login
 */
export const login = async (username, password) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/login`,
      { username, password },
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      }
    );

    // Save admin user to localStorage
    if (typeof window !== 'undefined' && response?.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error('Login Error:', error);
    throw toReadableError(error);
  }
};

/**
 * 🎓 STUDENT LOGIN
 * Calls:
 *   {API_URL}/student/login
 */
export const loginStudent = async (username, password) => {
  try {
    const response = await axios.post(
      `${API_URL}/student/login`,
      { username, password },
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      }
    );

    // Save student user to localStorage
    if (typeof window !== 'undefined' && response?.data?.user) {
      localStorage.setItem('student_user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error('Student Login Error:', error);
    throw toReadableError(error);
  }
};

/**
 * 🚪 LOGOUT
 * Calls:
 *   {API_URL}/logout
 */
export const logout = async () => {
  try {
    await axios.post(
      `${API_URL}/logout`,
      {},
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      }
    );
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('student_user');
      window.location.href = '/';
    }
  }
};

/**
 * Optional: export API_URL for debugging (remove if you want)
 */
export const __API_URL__ = API_URL;
