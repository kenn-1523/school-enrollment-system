'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

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
 * Local (.env.local):
 *   NEXT_PUBLIC_API_URL=http://localhost:3001
 *
 * Production (hosting panel):
 *   NEXT_PUBLIC_API_URL=https://croupiertraining.sgwebworks.com
 *
 * DO NOT hardcode URLs in components.
 */

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function normalizeBaseUrl(url) {
  if (!url) return '';
  return url.replace(/\/+$/, '');
}

export const AuthProvider = ({ children }) => {
  const API_BASE_URL = useMemo(() => normalizeBaseUrl(RAW_API_URL), []);

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
      const res = await axios.get(`${API_BASE_URL}/api/me`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (res.status === 200 && res.data?.user) {
        const currentUser = res.data.user;

        setUser(currentUser);

        // Admin detection logic
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
      // Network error / expired session
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
      await axios.post(
        `${API_BASE_URL}/api/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
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
