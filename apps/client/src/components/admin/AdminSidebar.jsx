'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ShieldCheck, LogOut, ClipboardList, UserCheck, XCircle, 
  Settings, ChevronRight, ChevronLeft, BookOpen 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Point to Shared CSS
import '../../features/admin/AdminDashboard.css';

export default function AdminSidebar({ activeTab, onTabChange }) {
  const router = useRouter();
  const pathname = usePathname(); 
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Helper: Are we on the main dashboard?
  const isDashboard = pathname === '/admin';

  const handleNavigation = (tabName) => {
    if (tabName === 'courses') {
        router.push('/admin/courses');
        return;
    }

    // Always push the URL parameter. 
    // If we are already on the dashboard, Next.js will handle this as a shallow route update.
    // If we are on courses, this will navigate back correctly.
    router.push(`/admin?tab=${tabName}`);
    
    // Update local state if provided (for instant feedback)
    if (onTabChange) {
        onTabChange(tabName);
    }
  };

  const handleLogout = () => {
      if (typeof window !== 'undefined' && window.confirm("Are you sure you want to log out?")) {
          logout();
      }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
         <div className="sidebar-header">
            <div className="logo-wrapper">
                <div className="logo-icon"><ShieldCheck size={24} color="white"/></div>
                <div className="logo-text"><h2>Instructor</h2><span>Control Panel</span></div>
            </div>
            <button className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
        </div>
        
        <nav className="sidebar-nav">
            <button className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => handleNavigation('applications')}>
                <ClipboardList size={20}/>
                <span className="nav-text">Applications</span>
            </button>
            
            <button className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => handleNavigation('students')}>
                <UserCheck size={20}/>
                <span className="nav-text">Enrolled Students</span>
            </button>

            <button className={`nav-item ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => handleNavigation('rejected')}>
                <XCircle size={20}/>
                <span className="nav-text">Rejected History</span>
            </button>

            <div className="my-2 border-t border-slate-700/50"></div>

            <button className={`nav-item ${pathname.includes('courses') ? 'active' : ''}`} onClick={() => handleNavigation('courses')}>
                <BookOpen size={20}/>
                <span className="nav-text">Course Editor</span>
            </button>

            <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleNavigation('settings')}>
                <Settings size={20}/>
                <span className="nav-text">Settings</span>
            </button>
        </nav>

        <div className="sidebar-footer">
            <button className="logout-btn-sidebar" onClick={handleLogout}>
                <LogOut size={18}/>
                <span className="nav-text">Log Out</span>
            </button>
        </div>
    </aside>
  );
}