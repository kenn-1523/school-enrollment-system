'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import './admin-login.css';

export default function AdminLoginPage() {
  const router = useRouter();
  // include adminLogin so that we can sync token to context before routing
  const { isAdmin, loading, adminLogin } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showWake, setShowWake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if already logged in as admin
  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace('/admin');
    } else if (!loading) {
      setIsChecking(false);
    }
  }, [isAdmin, loading, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setShowWake(false);
    const wakeTimer = setTimeout(() => setShowWake(true), 2000);

    try {
      await login(formData.username, formData.password);
      // make sure the auth context picks up the new token before redirecting
      if (typeof adminLogin === 'function') {
        await adminLogin();
      }
      clearTimeout(wakeTimer);
      router.push('/admin');
    } catch (err) {
      clearTimeout(wakeTimer);
      setError(err.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  if (isChecking || (loading && !isAdmin)) {
    return (
      <div className="admin-login-loading">
        <div className="loader">Verifying Admin Access...</div>
        {showWake && <div className="wake-msg">Waking up server, please wait...</div>}
      </div>
    );
  }

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h2>🔐 Admin Portal</h2>
          <p>Enter your admin credentials</p>
        </div>

        {error && (
          <div className="admin-login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isLoading && showWake && (
            <div className="wake-msg-form">
              Waking up server, please wait...
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="admin-login-button"
          >
            {isLoading ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
