'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/apiClient';

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  loading: false,
  adminLogin: async () => {},
  logout: async () => {},
});

// API base is centralized in lib/apiClient.js; it always points to the Render deployment.

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // CHECK CURRENT SESSION
  // ---------------------------
  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      // Don't call /me if no token exists
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const res = await api.get('/me', { timeout: 15000 });

      if (res.status === 200 && res.data?.user) {
        const currentUser = res.data.user;
        setUser(currentUser);
        // only consider role field for admin status
        if (currentUser.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      // clear potentially invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // ADMIN LOGIN (refresh session)
  // ---------------------------
  const adminLogin = async () => {
    await checkUser();
  };

  // ---------------------------
  // LOGOUT
  // ---------------------------
  const logout = async () => {
    try {
      await api.post('/logout', {}, { timeout: 10000 });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAdmin(false);

      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        adminLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
