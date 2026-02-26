import { api } from '@/lib/apiClient';

/**
 * ✅ WORKS LOCALLY + DEPLOYED (Best practice)
 *
 * Local (apps/client/.env.local):
 *   NEXT_PUBLIC_API_URL=https://api-croupiertraining.sgwebworks.com
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

// Uses centralized `api` instance. Endpoints:
// POST /admin/login
// POST /student/login
// POST /logout

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
    const response = await api.post('/admin/login', { username, password }, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });

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
    const response = await api.post('/student/login', { username, password }, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });

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
    await api.post('/logout', {}, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });
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
// NOTE: API base URL is controlled by NEXT_PUBLIC_API_URL and centralized in src/lib/apiClient.js
