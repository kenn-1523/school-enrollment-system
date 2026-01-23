import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react'; 

export const ProtectedRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', position: 'fixed', top: 0, left: 0, zIndex: 9999}}>
        <Loader className="animate-spin" size={50} color="#3b82f6" />
      </div>
    );
  }

  // If Admin tries to view Student Dashboard -> They get sent to Admin Dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If No one is logged in -> Login Page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const AdminProtectedRoute = ({ children }) => {
  const { isAdmin, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div style={{height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', position: 'fixed', top: 0, left: 0, zIndex: 9999}}>
        <Loader className="animate-spin" size={50} color="#fbbf24" />
      </div>
    );
  }

  // If Student tries to view Admin Dashboard -> Send to Student Dashboard
  if (user && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;