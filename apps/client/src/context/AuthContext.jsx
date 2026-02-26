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

/**
 * ✅ ENV STRATEGY (BEST PRACTICE)
 *
 * Set the frontend API base URL via environment variable:
 *   NEXT_PUBLIC_API_URL=https://api-croupiertraining.sgwebworks.com
 *
 * Do not hardcode local development URLs in production code.
 */

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
      const res = await api.get('/me', { timeout: 15000 });

      if (res.status === 200 && res.data?.user) {
        const currentUser = res.data.user;
        setUser(currentUser);
        if (currentUser.isAdmin === true || currentUser.role === 'admin' || currentUser.username === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
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

      // safer redirect
      if (typeof window !== 'undefined') {
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
