'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { api, API_BASE } from '@/lib/apiClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sun, Moon, X, FileText, ExternalLink, Mail, Phone, Calendar, GraduationCap, Briefcase, MapPin, BookOpen, ChevronDown, ListChecks } from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext.jsx';

import AdminSidebar from '../../components/admin/AdminSidebar';
import CustomAlert from '../../components/CustomAlert';
import ApplicationsTable from '../../components/admin/tables/ApplicationsTable';
import EnrolledTable from '../../components/admin/tables/EnrolledTable';
import RejectedTable from '../../components/admin/tables/RejectedTable';
import SettingsPanel from '../../components/admin/settings/SettingsPanel';

import './AdminDashboard.css';



const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

function DashboardContent() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get('tab') || 'applications';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [students, setStudents] = useState([]);
  const [enrolledProgress, setEnrolledProgress] = useState([]); // Raw data (multiple rows per student)
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('details'); 

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false, type: 'default', title: '', message: '', confirmText: 'Confirm', onConfirm: () => {}
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

const fetchStudents = async () => {
  setLoading(true);
  try {
    const res = await api.get('/api/admin/students?limit=1000');

    console.log("Students API response:", res.data);

    const list =
      res?.data?.students ||
      res?.data?.data ||
      res?.data ||
      [];

    setStudents(Array.isArray(list) ? list : []);
  } catch (err) {
    console.error(
      "Fetch students error:",
      err.response?.data || err.message
    );
    setStudents([]);
  } finally {
    setLoading(false);
  }
};

  const fetchEnrolledProgress = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/score-report');
      setEnrolledProgress(res.data || []);
    } catch (err) {
      console.error("Fetch score report error:", err);
      setEnrolledProgress([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'students') {
      fetchEnrolledProgress();
    } else {
      fetchStudents();
    }
  }, []); 

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    router.push(`/admin?tab=${newTab}`);
    if (newTab === 'students') {
      fetchEnrolledProgress();
    } else if (newTab === 'applications' || newTab === 'rejected') {
      fetchStudents();
    }
  };

  const triggerAlert = (type, title, message, confirmText, action) => {
    setAlertConfig({
      isOpen: true, type, title, message, confirmText,
      onConfirm: async () => { await action(); setAlertConfig(prev => ({ ...prev, isOpen: false })); }
    });
  };

  const handleViewStudent = (student, mode = 'details') => {
    setSelectedStudent(student);
    setViewMode(mode);
  };

  // ✅ LOGIC: Group raw rows by Student ID so the table only shows 1 row per student
  const uniqueStudents = useMemo(() => {
    const map = new Map();
    enrolledProgress.forEach(row => {
      if (!map.has(row.student_id)) {
        map.set(row.student_id, {
            ...row,
            courseCount: 1 // Start counting
        });
      } else {
        // Increment count for display
        const existing = map.get(row.student_id);
        existing.courseCount += 1;
      }
    });
    return Array.from(map.values());
  }, [enrolledProgress]);

  // ✅ LOGIC: When clicking a unique student, find ALL their courses from raw data
  const handleViewProgress = (row) => {
    const allCoursesForStudent = enrolledProgress.filter(
      item => item.student_id === row.student_id
    );
    
    setSelectedStudent({
      ...row,
      all_courses: allCoursesForStudent 
    });
    setViewMode('progress');
  };

  // API_BASE already contains "/api" so avoid double prefix
  const getFileUrl = (filename) => `${API_BASE}/secure-file/${filename}`;

  // Filters
  const filteredStudents = students.filter(s =>
    (s.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.student_id?.toString() || '').includes(searchQuery)
  );
  const applications = filteredStudents.filter(s => String(s.application_status || '').toUpperCase() === 'PENDING');
  const rejected = filteredStudents.filter(s => String(s.application_status || '').toUpperCase() === 'REJECTED');

  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      <div className="admin-layout">
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />

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

            {activeTab === 'students' && (
              <EnrolledTable
                data={uniqueStudents} // ✅ Pass UNIQUE list
                loading={loading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                refreshData={fetchEnrolledProgress}
                triggerAlert={triggerAlert}
                onRowClick={handleViewProgress} 
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
                  {(selectedStudent.student_name?.[0]) || (selectedStudent.first_name?.[0]) || 'S'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedStudent.student_name || `${selectedStudent.first_name} ${selectedStudent.last_name}`}
                  </h2>
                  <p className="text-sm text-slate-400">{selectedStudent.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body p-6 overflow-y-auto max-h-[70vh]">

              {viewMode === 'details' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><Mail size={12} /> Email</label><div className="text-slate-200">{selectedStudent.email}</div></div>
                      <div><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><Phone size={12} /> Mobile</label><div className="text-slate-200">{selectedStudent.mobile || 'N/A'}</div></div>
                      <div><label className="block text-xs text-slate-500 mb-1">Civil Status</label><div className="text-slate-200">{selectedStudent.civil_status || 'N/A'}</div></div>
                      <div><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12} /> DOB</label><div className="text-slate-200">{formatDate(selectedStudent.dob)}</div></div>
                      <div><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><GraduationCap size={12} /> Education</label><div className="text-slate-200">{selectedStudent.education_level || 'N/A'}</div></div>
                      <div><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><Briefcase size={12} /> Employment</label><div className="text-slate-200">{selectedStudent.employment_status || 'N/A'}</div></div>
                      <div className="col-span-full"><label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin size={12} /> Address</label><div className="text-slate-200">{selectedStudent.city}, {selectedStudent.province} {selectedStudent.zip_code}</div></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Submitted Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ID File */}
                      <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="text-slate-400" size={24} />
                          <div><p className="text-sm font-bold text-slate-200">Valid ID</p><p className="text-xs text-slate-500">{selectedStudent.id_file ? 'Uploaded' : 'Missing'}</p></div>
                        </div>
                        {selectedStudent.id_file && (
                          <a href={getFileUrl(selectedStudent.id_file)} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded transition-colors"><ExternalLink size={18} /></a>
                        )}
                      </div>
                      {/* Birth Cert */}
                      <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="text-slate-400" size={24} />
                          <div><p className="text-sm font-bold text-slate-200">Birth Certificate</p><p className="text-xs text-slate-500">{selectedStudent.birth_cert_file ? 'Uploaded' : 'Missing'}</p></div>
                        </div>
                        {selectedStudent.birth_cert_file && (
                          <a href={getFileUrl(selectedStudent.birth_cert_file)} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded transition-colors"><ExternalLink size={18} /></a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- MODE 2: DROPDOWN LIST (ACCORDION) --- */}
              {viewMode === 'progress' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                       <BookOpen size={16} /> Enrolled Courses ({selectedStudent.all_courses?.length || 0})
                     </h3>
                  </div>

                  {selectedStudent.all_courses && selectedStudent.all_courses.length > 0 ? (
                    selectedStudent.all_courses.map((course, idx) => (
                      <details key={`${course.course_code}-${idx}`} className="group bg-[#0f172a] border border-slate-700 rounded-lg overflow-hidden transition-all duration-200 open:border-blue-500/50 open:shadow-lg open:shadow-blue-900/10">
                        
                        <summary className="p-4 cursor-pointer list-none flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className={`p-2 rounded-lg ${course.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                <BookOpen size={20} />
                             </div>
                             <div>
                               <h4 className="text-sm font-bold text-white group-open:text-blue-400 transition-colors">
                                 {course.course_title}
                               </h4>
                               <p className="text-xs text-slate-500 font-mono">{course.course_code}</p>
                             </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Grade</p>
                              <p className="text-base font-bold text-white">{course.grade || '—'}</p>
                            </div>
                            <ChevronDown className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform duration-200" />
                          </div>
                        </summary>

                        <div className="p-4 border-t border-slate-700/50 bg-[#1e293b]/50">
                           <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                              <ListChecks size={14} /> Quiz Breakdown
                           </div>

                           {course.grade_details ? (
                             <div className="grid grid-cols-1 gap-2">
                               {course.grade_details.split('|').map((item, i) => {
                                 const [label, score] = item.split(':').map(s => s.trim());
                                 return (
                                   <div key={i} className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700/50">
                                      <span className="text-sm text-slate-300">{label}</span>
                                      <span className={`font-mono font-bold text-sm ${score?.startsWith('0') ? 'text-slate-500' : 'text-emerald-400'}`}>
                                        {score}
                                      </span>
                                   </div>
                                 );
                               })}
                             </div>
                           ) : (
                             <div className="text-center py-4 text-slate-500 italic text-sm">
                               No quiz data recorded.
                             </div>
                           )}
                           
                           <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between text-xs text-slate-500">
                             <span>Enrolled: {formatDate(course.enrolled_at)}</span>
                             <span className={`px-2 py-0.5 rounded-full font-bold ${
                               course.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                             }`}>
                               {course.status || 'In Progress'}
                             </span>
                           </div>
                        </div>
                      </details>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500">No courses found.</div>
                  )}
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

      <CustomAlert
        isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message}
        onConfirm={alertConfig.onConfirm} onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        confirmText={alertConfig.confirmText} cancelText="Cancel"
      />
    </div>
  );
}

const AdminDashboard = () => {
  const auth = useAuth();
  useEffect(() => { if (!auth.loading && !auth.isAdmin) window.location.href = '/login'; }, [auth.loading, auth.isAdmin]);
  if (auth.loading) return <div className="loading-screen">Loading Portal...</div>;
  if (!auth.isAdmin) return null;
  return <Suspense fallback={<div className="loading-screen">Loading...</div>}><DashboardContent /></Suspense>;
};

export default AdminDashboard;