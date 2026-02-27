'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { login } from '../../services/authService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Loader, Eye, EyeOff } from 'lucide-react';
import CustomAlert from '../../components/CustomAlert';
import { useAuth } from '../../context/AuthContext';
import './AdminLogin.css';

// login page uses centralized api client via authService. JWT stored in localStorage.

const LoginPage = () => {
  const router = useRouter();
  const { adminLogin, isAdmin, loading } = useAuth();

  // centralized API client: `api`

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [status, setStatus] = useState({ loading: false, error: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showWake, setShowWake] = useState(false);

  // Controls the Success Modal
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // ✅ AUTO-REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace('/admin');
    }
  }, [isAdmin, loading, router]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setStatus((prev) => ({ ...prev, error: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '' });
    setShowWake(false);
    const wakeTimer = setTimeout(() => setShowWake(true), 2000);

    try {
      await login(formData.username, formData.password);
      setStatus({ loading: false, error: '' });
      setLoginModalOpen(true);
    } catch (err) {
      console.error('Admin login error:', err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Access Denied: Invalid Admin Credentials';

      setStatus({ loading: false, error: message });
    } finally {
      clearTimeout(wakeTimer);
      setShowWake(false);
    }
  };

  // Proceed to Dashboard
  const handleProceedToDashboard = async () => {
    setLoginModalOpen(false);

    // Update Context
    try {
      if (typeof adminLogin === 'function') {
        await adminLogin();
      }
    } catch (err) {
      console.error('adminLogin() refresh error:', err);
    }

    // Navigate
    router.push('/admin');
  };

  // If we are checking auth, show blank screen to prevent form flash
  if (loading || isAdmin) {
    return <div style={{ height: '100vh', background: '#0f172a' }}></div>;
  }

  return (
    <>
      <div className="admin-login-wrapper">
        <Link
          href="/"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            textDecoration: 'none',
            fontWeight: 'bold',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            zIndex: 20
          }}
        >
          &larr; Back to Site
        </Link>

        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="icon-wrapper">
              <ShieldCheck size={32} color="#3b82f6" />
            </div>
            <h2>Admin Portal</h2>
            <p>Authorized personnel only</p>
          </div>

          {status.error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}
            >
              {status.error}
            </div>
          )}
          {status.loading && showWake && (
            <div
              style={{
                color: '#fbbf24',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}
            >
              Waking up server, please wait...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="admin-input-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="admin"
                className="admin-input"
                autoComplete="username"
              />
            </div>

            <div className="admin-input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="admin-input"
                  style={{ paddingRight: '40px' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={status.loading}
              className="btn-admin-submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: status.loading ? 0.7 : 1,
                cursor: status.loading ? 'not-allowed' : 'pointer'
              }}
            >
              {status.loading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <>
                  Login <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>


        </div>
      </div>

      {/* SUCCESS MODAL */}
      <CustomAlert
        isOpen={loginModalOpen}
        type="success"
        title="Access Granted"
        message="Redirecting to dashboard..."
        onConfirm={handleProceedToDashboard}
        onClose={() => setLoginModalOpen(false)}
        confirmText="Open Dashboard"
      />
    </>
  );
};

export default LoginPage;
