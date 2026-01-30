'use client';

import React from 'react';
// 1. Import BOTH Contexts
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext'; 

export function Providers({ children }) {
  return (
    // 2. Wrap them together. Auth on the outside, Theme inside.
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}