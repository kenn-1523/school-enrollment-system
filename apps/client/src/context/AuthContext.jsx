'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  loading: false,
  adminLogin: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ SMART URL: Detects if you are on Localhost or Cloud
  const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001' 
    : 'https://mediumpurple-turtle-960137.hostingersite.com/backend_api';

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // 👇 Uses the Smart URL
      const res = await axios.get(`${API_BASE_URL}/api/me`, { 
        withCredentials: true 
      });

      if (res.status === 200 && res.data.user) {
        setUser(res.data.user);
        if (res.data.user.isAdmin || res.data.user.username === 'admin') {
            setIsAdmin(true);
        }
      } else {
        setIsAdmin(false);
        setUser(null);
      }
    } catch (error) {
      setIsAdmin(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async () => {
    await checkUser(); 
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/logout`, {}, { withCredentials: true });
    } finally {
      setUser(null);
      setIsAdmin(false);
      window.location.href = '/login'; 
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);