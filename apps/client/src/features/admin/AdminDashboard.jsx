'use client';

import React, { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sun, Moon, X, FileText, ExternalLink, Trophy, Dices, Coins, Mail, Phone, Calendar, GraduationCap, Briefcase, MapPin } from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext.jsx';

// ✅ IMPORT SEPARATED COMPONENTS
import AdminSidebar from '../../components/admin/AdminSidebar';
import CustomAlert from '../../components/CustomAlert';
import ApplicationsTable from '../../components/admin/tables/ApplicationsTable';
import EnrolledTable from '../../components/admin/tables/EnrolledTable';
import RejectedTable from '../../components/admin/tables/RejectedTable';
import SettingsPanel from '../../components/admin/settings/SettingsPanel';

import './AdminDashboard.css';

// ✅ IMPORTANT: Keep a single source of truth for the API base URL.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Normalize DB / API status values (DB uses: PENDING / APPROVED / REJECTED)
const normalizeStatus = (status) => String(status || '').trim().toUpperCase();

// Helper for Images
const isImage = (filename) => {
  if (!filename) return false;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
};

// Helper for Date
const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Inner Component to handle Search Params safely
function DashboardContent() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const searchParams = useSearchParams();

  // --- STATE ---
  // Initialize tab from URL or default to 'applications'
  const initialTab = searchParams.get('tab') || 'applications';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [students, setStudents] = useState([]);
  const [enrolledProgress, setEnrolledProgress] = useState([]); // ✅ NEW: Enrolled Progress State
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('details'); // 'details' or 'progress'

  // Alert State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'default',
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  // --- URL SYNC ---
  // When URL changes, update state
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // --- DATA FETCHING ---
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("authToken");

      const res = await axios.get(`${API_URL}/api/admin/students?limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });

      const list = res?.data?.students || res?.data?.data || res?.data || [];
      setStudents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Fetch Enrolled Progress (Modules/Scores)
  const fetchEnrolledProgress = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/enrolled-progress`, { withCredentials: true });
      setEnrolledProgress(res.data.students || []);
    } catch (err) {
      console.error("Fetch enrolled progress error:", err);
      setEnrolledProgress([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch based on current tab
    if (activeTab === 'students') {
      fetchEnrolledProgress();
    } else {
      fetchStudents();
    }
  }, []); 

  // --- HANDLERS ---
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Update URL without reloading page
    router.push(`/admin?tab=${newTab}`);
    
    // ✅ NEW: Trigger specific fetch when switching tabs
    if (newTab === 'students') {
      fetchEnrolledProgress();
    } else if (newTab === 'applications' || newTab === 'rejected') {
      fetchStudents();
    }
  };

  const triggerAlert = (type, title, message, confirmText, action) => {
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      onConfirm: async () => {
        await action();
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleViewStudent = (student, mode = 'details') => {
    setSelectedStudent(student);
    setViewMode(mode);
  };

  const getFileUrl = (filename) => `${API_URL}/api/secure-file/${filename}`;

  // --- FILTERING ---
  const filteredStudents = students.filter(s =>
    (s.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.student_id?.toString() || '').includes(searchQuery)
  );

  // ✅ FIXED: Uppercase status matching
  const applications = filteredStudents.filter(s => String(s.application_status || '').toUpperCase() === 'PENDING');
  // Note: Enrolled table now uses `enrolledProgress` state directly, so this filter is just for fallback or legacy count
  const enrolled = filteredStudents.filter(s => String(s.application_status || '').toUpperCase() === 'APPROVED' || String(s.application_status || '').toUpperCase() === 'ENROLLED');
  const rejected = filteredStudents.filter(s => String(s.application_status || '').toUpperCase() === 'REJECTED');

  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      <div className="admin-layout">

        {/* SIDEBAR */}
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* MAIN CONTENT AREA */}
        <main className="main-content">
          <header className="top-bar">
            <h2 className="page-title">
              {activeTab === 'applications' && 'New Applications'}
              {activeTab === 'students' && 'Enrolled Students'}
              {activeTab === 'rejected' && 'Rejected History'}
              {activeTab === 'settings' && 'Admin Settings'}
            </h2>
            <div className="top-bar-actions">
              <button className="theme-toggle-btn" onClick={toggleTheme}>
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="admin-profile">
                <div className="avatar">A</div><span>Admin</span>
              </div>
            </div>
          </header>

          <div className="content-wrapper">

            {activeTab === 'applications' && (
              <ApplicationsTable
                data={applications}
                loading={loading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                refreshData={fetchStudents}
                triggerAlert={triggerAlert}
                onRowClick={(s) => handleViewStudent(s, 'details')}
              />
            )}

            {/* ✅ FIXED: Use EnrolledProgress state and fetch function */}
            {activeTab === 'students' && (
              <EnrolledTable
                data={enrolledProgress}
                loading={loading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                refreshData={fetchEnrolledProgress}
                triggerAlert={triggerAlert}
                onRowClick={(student) => {
                    setSelectedStudent(student);
                    setViewMode('progress');
                }}
              />
            )}

            {activeTab === 'rejected' && (
              <RejectedTable
                data={rejected}
                loading={loading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                refreshData={fetchStudents}
                triggerAlert={triggerAlert}
                onRowClick={(s) => handleViewStudent(s, 'details')}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel triggerAlert={triggerAlert} />
            )}

          </div>
        </main>
      </div>

      {/* --- UNIFIED MODAL --- */}
      {selectedStudent && (
        <div className="admin-modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white uppercase">
                  {selectedStudent.first_name?.[0] || 'S'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h2>
                  <p className="text-sm text-slate-400">Student ID: #{selectedStudent.student_id}</p>
                  {/* ✅ ADDED: Start Date in Header */}
                  <p className="text-xs text-slate-500">Start Date: {selectedStudent.start_date || 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Body - Switch based on Mode */}
            <div className="modal-body p-6 overflow-y-auto max-h-[70vh]">

              {/* --- MODE 1: DETAILS (App/Rejected) --- */}
              {viewMode === 'details' && (
                <div className="space-y-8">
                  {/* Personal Info */}
                  <div>
                    <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><Mail size={12} /> Email</label><div className="text-slate-200">{selectedStudent.email}</div></div>
                      <div><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><Phone size={12} /> Mobile</label><div className="text-slate-200">{selectedStudent.mobile || 'N/A'}</div></div>
                      <div><label className="block text-xs text-slate-500 mb-1">Civil Status</label><div className="text-slate-200">{selectedStudent.civil_status || 'N/A'}</div></div>
                      <div><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Date of Birth</label><div className="text-slate-200">{formatDate(selectedStudent.dob)}</div></div>
                      <div><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><GraduationCap size={12} /> Education</label><div className="text-slate-200">{selectedStudent.education_level || 'N/A'}</div></div>
                      <div><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><Briefcase size={12} /> Employment</label><div className="text-slate-200">{selectedStudent.employment_status || 'N/A'}</div></div>
                      <div className="col-span-full"><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin size={12} /> Address</label><div className="text-slate-200">{selectedStudent.city}, {selectedStudent.province} {selectedStudent.zip_code}</div></div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Submitted Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="text-slate-400" size={24} />
                          <div>
                            <p className="text-sm font-bold text-slate-200">Valid ID</p>
                            <p className="text-xs text-slate-500">{selectedStudent.id_file ? 'Uploaded' : 'Missing'}</p>
                          </div>
                        </div>
                        {selectedStudent.id_file && (
                          <a href={getFileUrl(selectedStudent.id_file)} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded transition-colors">
                            <ExternalLink size={18} />
                          </a>
                        )}
                      </div>
                      <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="text-slate-400" size={24} />
                          <div>
                            <p className="text-sm font-bold text-slate-200">Birth Certificate</p>
                            <p className="text-xs text-slate-500">{selectedStudent.birth_cert_file ? 'Uploaded' : 'Missing'}</p>
                          </div>
                        </div>
                        {selectedStudent.birth_cert_file && (
                          <a href={getFileUrl(selectedStudent.birth_cert_file)} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded transition-colors">
                            <ExternalLink size={18} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- MODE 2: PROGRESS (Enrolled) --- */}
              {viewMode === 'progress' && (
                <div className="space-y-8">
                  {/* Stats Overview - Calculated from modules if available, else 0 */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-700 text-center">
                      <Trophy className="mx-auto text-amber-500 mb-2" size={24} />
                      <div className="text-2xl font-bold text-white">
                        {selectedStudent.modules?.reduce((acc, m) => acc + (m.status === 'COMPLETED' ? 1 : 0), 0) || 0}
                      </div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Modules Completed</div>
                    </div>
                    <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-700 text-center">
                      <Dices className="mx-auto text-emerald-500 mb-2" size={24} />
                      <div className="text-2xl font-bold text-white">
                        {(() => {
                           const scores = selectedStudent.modules?.filter(m => m.avg_quiz_score != null).map(m => Number(m.avg_quiz_score)) || [];
                           const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                           return Math.round(avg) + '%';
                        })()}
                      </div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Average Score</div>
                    </div>
                    <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-700 text-center">
                      <Coins className="mx-auto text-blue-500 mb-2" size={24} />
                      <div className="text-2xl font-bold text-white">Trainee</div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Current Rank</div>
                    </div>
                  </div>

                  {/* ✅ UPDATED: Module List from Prompt */}
                  <div>
                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">
                        Module Progress
                    </h3>

                    {(!selectedStudent.modules || selectedStudent.modules.length === 0) ? (
                        <div className="bg-[#0f172a] border border-slate-700 rounded-lg p-8 text-center">
                        <p className="text-slate-400 font-medium">No modules found for this student.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                        {selectedStudent.modules.map((m, idx) => (
                            <div key={`${m.course_code}-${idx}`} className="bg-[#0f172a] border border-slate-700 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                <div className="text-sm font-bold text-slate-200">{m.course_title}</div>
                                <div className="text-xs text-slate-500">{m.course_code}</div>
                                </div>

                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                                m.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : m.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                }`}>
                                {m.status}
                                </span>
                            </div>

                            <div className="mt-3">
                                <div className="flex items-center gap-2">
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div
                                    className="bg-emerald-500 h-2 rounded-full"
                                    style={{ width: `${m.progress_percent || 0}%` }}
                                    />
                                </div>
                                <div className="text-xs text-slate-400 w-10 text-right">{m.progress_percent || 0}%</div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                                <div><span className="text-slate-500">Lessons:</span> {m.completed_lessons}/{m.total_lessons}</div>
                                <div><span className="text-slate-500">Avg Score:</span> {m.avg_quiz_score == null ? '—' : Number(m.avg_quiz_score).toFixed(1)}</div>
                                <div><span className="text-slate-500">Last Done:</span> {m.last_completed_at ? new Date(m.last_completed_at).toLocaleString() : '—'}</div>
                                </div>
                            </div>
                            </div>
                        ))}
                        </div>
                    )}
                    </div>
                </div>
              )}
            </div>

            <div className="modal-footer p-6 border-t border-slate-700 flex justify-end">
              <button onClick={() => setSelectedStudent(null)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold text-sm transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ALERT COMPONENT --- */}
      <CustomAlert
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        confirmText={alertConfig.confirmText}
        cancelText="Cancel"
      />
    </div>
  );
}

// Main component wraps content in Suspense to prevent hydration errors
const AdminDashboard = () => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.loading && !auth.isAdmin) {
      window.location.href = '/login';
    }
  }, [auth.loading, auth.isAdmin]);

  if (auth.loading) return <div className="loading-screen">Loading Portal...</div>;
  if (!auth.isAdmin) return null;

  return (
    <Suspense fallback={<div className="loading-screen">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
};

export default AdminDashboard;