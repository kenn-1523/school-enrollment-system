'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext'; 

export default function Navbar() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const pathname = usePathname();

  // Helper to check if link is active
  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // 3. UNIVERSAL SCROLL LISTENER
  useEffect(() => {
    const handleScroll = () => {
      // Check ALL possible scroll values to find the real one
      const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      
      // If we have scrolled more than 20px...
      if (scrollPosition > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    // Listen to BOTH window and document body just in case
    window.addEventListener('scroll', handleScroll);
    document.body.addEventListener('scroll', handleScroll);
    
    // Check immediately on load
    handleScroll(); 

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
      <nav 
        className="navbar" 
        id="navbar"
        style={scrolled ? {
            background: '#0f172a',
            borderBottom: '1px solid #fbbf24',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        } : {
            background: 'transparent',
            borderBottom: '1px solid transparent',
            boxShadow: 'none'
        }}
      >
        <div className="logo-container">
          <Link href="/" className="logo-link">
            <div className="logo-text-wrapper">
                <span className="brand-title">Elite-Croupiers</span>
                <span className="brand-subtitle">Training Services</span>
            </div>
          </Link>
        </div>

        <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`} id="navLinks">
            <Link href="/" className={isActive('/') ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/about" className={isActive('/about') ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/courses" className={isActive('/courses') ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Courses</Link>
            <Link href="/enroll" className={`mobile-enroll-btn ${isActive('/enroll') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Enroll Now</Link>
        </div>

        <div className="nav-actions-container">
            {/* 1. THEME TOGGLE */}
            <button 
                onClick={toggleTheme} 
                className="theme-toggle-btn" 
                aria-label="Toggle Theme"
            >
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            {/* 2. ENROLL BUTTON (Desktop) */}
            <div className="desktop-only-action">
                <Link href="/enroll">
                    <button className="btn-primary-nav">Enroll Now</button>
                </Link>
            </div>

            {/* 3. MOBILE MENU TOGGLE */}
            <div className="mobile-only-control">
                <button className="mobile-menu-btn" id="mobileMenuBtn" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </div>
      </nav>
  );
}