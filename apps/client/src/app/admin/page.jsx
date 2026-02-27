'use client'; // <--- Mandatory for Hostinger

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

// ✅ CONNECTION PRESERVED: This links to your existing Dashboard file
import AdminDashboard from '../../features/admin/AdminDashboard'; 

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const [showWake, setShowWake] = useState(false);

  // show wake message if auth check takes more than 2s
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setShowWake(true), 2000);
    return () => clearTimeout(t);
  }, [loading]);

  // 🔒 PROTECTION: If not admin, AuthContext/AdminDashboard will handle redirect
  // Show loading state while checking auth
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fbbf24',
        fontSize: '1.2rem'
      }}>
        Verifying Admin Access...
        {showWake && <div style={{marginTop: '0.5rem'}}>Waking up server, please wait...</div>}
      </div>
    );
  }

  // If not admin, AdminDashboard will redirect to /login
  return <AdminDashboard initialStudents={[]} />;
}