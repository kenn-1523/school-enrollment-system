import { api } from '@/lib/apiClient';

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
 * Calls POST /api/admin/login and persists JWT in localStorage
 */
export const login = async (username, password) => {
  try {
    const response = await api.post(
      '/api/admin/login',
      { username, password },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    if (typeof window !== 'undefined') {
      if (response?.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      if (response?.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response.data;
  } catch (error) {
    console.error('Login Error:', error);
    // timeout or network issues
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      throw new Error('Server taking too long to respond. It may be waking up; please try again.');
    }
    throw toReadableError(error);
  }
};

/**
 * 🎓 STUDENT LOGIN
 * Calls POST /api/student/login and persists JWT in localStorage
 */
export const loginStudent = async (username, password) => {
  try {
    const response = await api.post(
      '/api/student/login',
      { username, password },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    if (typeof window !== 'undefined') {
      if (response?.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      if (response?.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response.data;
  } catch (error) {
    console.error('Student Login Error:', error);
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      throw new Error('Server taking too long to respond. It may be waking up; please try again.');
    }
    throw toReadableError(error);
  }
};

/**
 * 🚪 LOGOUT
 * Clears localStorage and optionally notifies backend
 */
export const logout = async () => {
  try {
    // Added /api/ prefix here as well
    await api.post('/api/logout', {}, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  }
};  