'use client'; // <--- Mandatory for Hostinger

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

// ✅ CONNECTION PRESERVED: This links to your existing Dashboard file
import AdminDashboard from '../../features/admin/AdminDashboard'; 

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();

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
      </div>
    );
  }

  // If not admin, AdminDashboard will redirect to /login
  return <AdminDashboard initialStudents={[]} />;
}