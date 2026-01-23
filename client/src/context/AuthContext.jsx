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

  // Check for existing session on load (Fixes Hard Refresh)
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // We ask the backend: "Is the user logged in?"
      // This works even with HttpOnly cookies because the browser sends them automatically.
      const res = await axios.get('http://localhost:3001/api/me', { 
        withCredentials: true 
      });

      if (res.status === 200 && res.data.user) {
        setUser(res.data.user);
        // Assuming your API returns isAdmin: true for admins
        if (res.data.user.isAdmin || res.data.user.username === 'admin') {
            setIsAdmin(true);
        }
      } else {
        setIsAdmin(false);
        setUser(null);
      }
    } catch (error) {
      // If 401 or error, user is not logged in
      setIsAdmin(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async () => {
    await checkUser(); // Re-sync state after login
  };

  // --- LOGOUT LOGIC ---
  const logout = async () => {
    try {
      await axios.post('http://localhost:3001/api/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAdmin(false);
      
      // HARD RELOAD: Wipes client memory to prevent "Back" button access
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