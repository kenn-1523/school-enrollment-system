'use client'; 

import React, { useEffect, useState } from 'react'; // ✅ FIX: Imported useState here
import { createPortal } from 'react-dom';
import { LogOut, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './CustomAlert.css';

const CustomAlert = ({ open = false, isOpen, type = 'logout', title = '', message = '', onConfirm = () => {}, onClose = () => {}, confirmText, cancelText }) => {
  const visible = typeof isOpen === 'boolean' ? isOpen : open;
  const { isDarkMode } = useTheme();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (visible) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [visible]);

  // Prevent hydration mismatch (Next.js specific fix)
  if (!mounted || !visible) return null;

  const config = {
    logout: {
      icon: <LogOut size={32} />,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      btnClass: 'btn-danger'
    },
    success: {
      icon: <CheckCircle size={32} />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      btnClass: 'btn-success'
    },
    error: {
      icon: <AlertTriangle size={32} />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.08)',
      btnClass: 'btn-warning'
    }
  };

  const currentConfig = config[type] || config.logout;
  const themeClass = isDarkMode ? 'dark-theme' : 'light-theme';

  return createPortal(
    <div className="alert-backdrop">
      <div className={`alert-modal ${themeClass} animate-pop-in`} role="dialog" aria-modal="true">
        <button className="close-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>

        <div className="alert-icon-wrapper" style={{ color: currentConfig.color, background: currentConfig.bg }}>
          {currentConfig.icon}
        </div>

        {title && <h3 className="alert-title">{title}</h3>}
        {message && <p className="alert-message">{message}</p>}

        <div className="alert-actions">
          {onClose && cancelText && (
            <button className="btn-ghost" onClick={onClose}>{cancelText}</button>
          )}
          <button className={`btn-action ${currentConfig.btnClass}`} onClick={onConfirm}>{confirmText || 'Confirm'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomAlert;