import axios from 'axios';

// ✅ STRICTLY FORCE THE CORRECT URL
// We hardcode this to ensure it works regardless of your .env file
const API_URL = 'http://localhost:3001/api';

/**
 * 🔐 ADMIN LOGIN
 */
export const login = async (username, password) => {
  try {
    // Will call: http://localhost:3001/api/admin/login
    const response = await axios.post(`${API_URL}/admin/login`, {
      username,
      password,
    }, { withCredentials: true });

    if (response.data.user && typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: "Server unreachable" };
  }
};

/**
 * 🎓 STUDENT LOGIN
 */
export const loginStudent = async (username, password) => {
  try {
    // Will call: http://localhost:3001/api/student/login
    const response = await axios.post(`${API_URL}/student/login`, {
      username,
      password,
    }, { withCredentials: true });

    if (response.data.user && typeof window !== 'undefined') {
      localStorage.setItem('student_user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: "Server unreachable" };
  }
};

/**
 * 🚪 LOGOUT
 */
export const logout = async () => {
  try {
    await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
  } catch (err) {
    console.error("Logout error", err);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('student_user');
      window.location.href = '/';
    }
  }
};