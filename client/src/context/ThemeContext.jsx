'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Default values (Safety Net)
const ThemeContext = createContext({
  isDarkMode: true,
  toggleTheme: () => console.log("⚠️ Provider not connected!"),
});

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  // 1. Load preference from storage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('elite-theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
    }
  }, []);

  // 2. Apply theme to HTML tag
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    if (isDarkMode) {
      console.log("🌙 Switching to Dark Mode");
      html.removeAttribute('data-theme');
      localStorage.setItem('elite-theme', 'dark');
    } else {
      console.log("☀️ Switching to Light Mode");
      html.setAttribute('data-theme', 'light');
      localStorage.setItem('elite-theme', 'light');
    }
  }, [isDarkMode, mounted]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Prevent hydration mismatch
  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);