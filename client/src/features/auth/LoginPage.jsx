'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Loader, Eye, EyeOff } from 'lucide-react';
import CustomAlert from '../../components/CustomAlert';
import { useAuth } from '../../context/AuthContext';
import './AdminLogin.css'; 

const LoginPage = () => {
  const router = useRouter();
  const { adminLogin, isAdmin, loading } = useAuth(); // Pull isAdmin and loading

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [status, setStatus] = useState({ loading: false, error: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  // Controls the Success Modal
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // --- 🔒 SECURITY FIX: AUTO-REDIRECT IF ALREADY LOGGED IN ---
  // If the user presses "Back" from the dashboard, they land here.
  // Since they are still logged in, we immediately send them forward again.
  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace('/admin');
    }
  }, [isAdmin, loading, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus({ ...status, error: '' }); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '' });

    try {
      // 1. Call Backend Login API
      await axios.post('https://mediumpurple-turtle-960137.hostingersite.com/backend_api/api/admin/login', {
        username: formData.username,
        password: formData.password
      }, {
        withCredentials: true
      });

      // 2. Success - Show Modal
      setStatus({ loading: false, error: '' });
      setLoginModalOpen(true);
      
    } catch (err) {
      console.error(err);
      setStatus({ 
        loading: false, 
        error: 'Access Denied: Invalid Admin Credentials' 
      });
    }
  };

  // 3. Proceed to Dashboard
  const handleProceedToDashboard = async () => {
      setLoginModalOpen(false);
      
      // Update Context
      if (adminLogin) {
          await adminLogin(); 
      }
      
      // Navigate
      router.push('/admin');
  };

  // If we are checking auth, show a blank screen or loader to prevent form flash
  if (loading || isAdmin) return <div style={{height: '100vh', background: '#0f172a'}}></div>;

  return (
    <>
      <div className="admin-login-wrapper">
        <Link href="/" style={{position: 'absolute', top: '20px', left: '20px', textDecoration: 'none', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px', zIndex: 20}}>
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
            <div style={{background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem'}}>
              {status.error}
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
              />
            </div>

            <div className="admin-input-group">
              <label>Password</label>
              <div style={{position: 'relative'}}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="admin-input"
                  style={{ paddingRight: '40px' }} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex'}}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={status.loading}
              className="btn-admin-submit" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {status.loading ? <Loader className="animate-spin" size={20} /> : <>Login <ArrowRight size={20} /></>}
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