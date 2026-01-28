'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; 
import { 
  ShieldCheck, LogOut, CheckCircle, Users, BookOpen, 
  ChevronRight, ChevronLeft, Trash2, XCircle, Undo2,
  FileText, Search, BarChart3, Clock, ExternalLink, ClipboardList, UserCheck, Eye, X, Calendar, AlertTriangle, Settings, Lock
} from 'lucide-react';
import { Sun, Moon } from 'lucide-react';

import { useTheme } from '../../context/ThemeContext'; 
import { useAuth } from '../../context/AuthContext.jsx';    
import CustomAlert from '../../components/CustomAlert'; 

import './AdminDashboard.css';

// ==========================================
// ✅ GLOBAL HELPERS (Must be at the top)
// ==========================================

// 1. Image Extension Checker
const isImage = (filename) => {
    if (!filename) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
};

// 2. Date Formatter
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// 3. Secure Image Loader Component
const SecureImage = ({ filename, alt, className, style }) => {
    const [imgSrc, setImgSrc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!filename) return;
        setLoading(true);
        let active = true;
        
        // Use Env var if available, else localhost
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mediumpurple-turtle-960137.hostingersite.com/backend_api';

        axios.get(`${API_URL}/api/secure-file/${filename}`, { 
            responseType: 'blob', 
            withCredentials: true 
        })
        .then(res => {
            if (active) {
                const url = URL.createObjectURL(res.data);
                setImgSrc(url);
                setLoading(false);
            }
        })
        .catch(err => {
            console.error("Image load error", err);
            if (active) setLoading(false);
        });

        return () => { 
            active = false;
            if (imgSrc) URL.revokeObjectURL(imgSrc); 
        };
    }, [filename]);

    if (loading) return <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>Loading...</div>;
    if (!imgSrc) return <FileText size={24} color="var(--text-muted)"/>;

    return <img src={imgSrc} alt={alt} className={className} style={style} />;
};

// ==========================================
// ✅ MAIN COMPONENT
// ==========================================

const AdminDashboard = ({ initialStudents = [] }) => {
  const router = useRouter(); 
  const { isDarkMode, toggleTheme } = useTheme(); 
  const auth = useAuth(); 

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('applications'); 
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Ensure students is always an array
  const [students, setStudents] = useState(Array.isArray(initialStudents) ? initialStudents : []);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Modals
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Profile / Password Change State
  const [profileForm, setProfileForm] = useState({
      currentPassword: '',
      newUsername: '',
      newPassword: ''
  });

  // Alert State
  const [alertConfig, setAlertConfig] = useState({
      isOpen: false,
      type: 'default',
      title: '',
      message: '',
      confirmText: 'Confirm',
      onConfirm: () => {}
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mediumpurple-turtle-960137.hostingersite.com/backend_api';

  // --- 🔒 SECURITY CHECK ---
  useEffect(() => {
      if (!auth.loading) {
          if (!auth.isAdmin) {
              window.location.href = '/login';
          } else {
              // Fetch fresh data on load if empty
              if (students.length === 0) fetchStudents();
          }
      }
  }, [auth.loading, auth.isAdmin]);

  // --- API CALLS ---
  const fetchStudents = async (page = 1) => {
    try {
      // Fetching up to 1000 to show "All" students as requested
      const res = await axios.get(`${API_URL}/api/admin/students?page=${page}&limit=1000`, { withCredentials: true });
      
      const studentList = res.data.data || [];
      setStudents(studentList);
      
      if (res.data.pagination) {
          setPagination({
              page: res.data.pagination.page,
              totalPages: res.data.pagination.totalPages
          });
      }
    } catch (err) { console.error("Fetch error:", err); }
  };

  // --- ACTIONS ---
  const triggerAlert = (type, title, message, confirmText, confirmAction) => {
      setAlertConfig({
          isOpen: true, type, title, message, confirmText,
          onConfirm: async () => {
              await confirmAction();
              setAlertConfig(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  // 1. DELETE 
  const handleDeleteClick = (id) => {
      triggerAlert('logout', 'Delete Student', 'Are you sure? This cannot be undone.', 'Delete Permanently', () => executeDelete(id));
  };

  const executeDelete = async (id) => {
       try {
           await axios.delete(`${API_URL}/api/admin/students/${id}`, { withCredentials: true });
           fetchStudents(pagination.page); 
           if (selectedStudent?.student_id === id) setSelectedStudent(null);
       } catch (e) { alert("Failed to delete"); }
  };

  // 2. APPROVE (Enroll)
  const handleApproveClick = (id, name) => {
      triggerAlert('success', 'Approve Application', `Approve access for ${name}?`, 'Approve', () => executeApprove(id));
  };

  const executeApprove = async (id) => {
       try {
         await axios.post(`${API_URL}/api/admin/approve`, { studentId: id }, { withCredentials: true });
         fetchStudents(pagination.page); 
         if (selectedStudent?.student_id === id) setSelectedStudent(prev => ({...prev, application_status: 'Approved'}));
       } catch (err) { alert("Error approving student"); }
  };

  // 3. REJECT
  const handleRejectClick = (id, name) => {
      triggerAlert('warning', 'Reject Application', `Are you sure you want to reject ${name}?`, 'Reject', () => executeReject(id));
  };

  const executeReject = async (id) => {
      try {
          await axios.post(`${API_URL}/api/admin/reject`, { studentId: id }, { withCredentials: true });
          fetchStudents(pagination.page);
          if (selectedStudent?.student_id === id) setSelectedStudent(prev => ({...prev, application_status: 'Rejected'}));
      } catch (err) { alert("Error rejecting student."); }
  };

  // 4. RESTORE (To Pending)
  const handleRestoreClick = (id, name) => {
      triggerAlert('info', 'Restore Application', `Restore ${name} to Pending status?`, 'Restore', () => executeRestore(id));
  };

  const executeRestore = async (id) => {
      try {
          await axios.post(`${API_URL}/api/admin/restore`, { studentId: id }, { withCredentials: true });
          fetchStudents(pagination.page);
          if (selectedStudent?.student_id === id) setSelectedStudent(prev => ({...prev, application_status: 'Pending'}));
      } catch (err) { 
          console.error(err);
          alert("Error restoring. Please ensure backend support /api/admin/restore endpoint."); 
      }
  };

  // 5. UPDATE ADMIN PROFILE
  const handleProfileUpdate = async (e) => {
      e.preventDefault();
      try {
          await axios.put(`${API_URL}/api/admin/update-profile`, profileForm, { withCredentials: true });
          alert("Profile Updated Successfully! Please log in again.");
          auth.logout(); 
      } catch (err) {
          alert(err.response?.data?.message || "Update failed");
      }
  };

  const handleLogoutClick = () => {
      triggerAlert('logout', 'Log Out', 'Sign out of admin panel?', 'Log Out', () => auth.logout());
  };

  // --- FILTERS ---
  const safeStudents = Array.isArray(students) ? students : [];

  const searchFiltered = safeStudents.filter(student => 
    student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedStudents = activeTab === 'applications' 
      ? searchFiltered.filter(s => s.application_status === 'Pending')
      : activeTab === 'students'
      ? searchFiltered.filter(s => s.application_status === 'Approved')
      : activeTab === 'settings' 
      ? [] 
      : searchFiltered.filter(s => s.application_status === 'Rejected');

  const pendingCount = safeStudents.filter(s => s.application_status === 'Pending').length;

  // Helper for File URL inside component
  const getFileUrl = (filename) => `${API_URL}/api/secure-file/${filename}`;

  if (auth.loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#3b82f6'}}>Loading...</div>;
  if (!auth.isAdmin) return null;

  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      <div className="admin-layout">
        
        {/* SIDEBAR */}
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
                <button className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
                    <ClipboardList size={20}/>
                    <span className="nav-text">Applications</span>
                    {pendingCount > 0 && !isCollapsed && <span className="nav-badge">{pendingCount}</span>}
                </button>
                
                <button className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                    <UserCheck size={20}/>
                    <span className="nav-text">Enrolled Students</span>
                </button>

                <button className={`nav-item ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>
                    <XCircle size={20}/>
                    <span className="nav-text">Rejected History</span>
                </button>

                <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                    <Settings size={20}/>
                    <span className="nav-text">Settings</span>
                </button>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn-sidebar" onClick={handleLogoutClick}><LogOut size={18}/><span className="nav-text">Log Out</span></button>
            </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
             <header className="top-bar">
                <h2 className="page-title">
                    {activeTab === 'applications' ? 'New Applications' : 
                     activeTab === 'students' ? 'Enrolled Students' : 
                     activeTab === 'rejected' ? 'Rejected Applications' : 
                     'Admin Settings'}
                </h2>
                <div className="top-bar-actions">
                    <button className="theme-toggle-btn" onClick={toggleTheme}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
                    <div className="admin-profile"><div className="avatar">A</div><span>Admin</span></div>
                </div>
            </header>

            <div className="content-wrapper">
                
                {/* --- SETTINGS TAB --- */}
                {activeTab === 'settings' ? (
                    <div className="animate-fade-in" style={{maxWidth: '600px', margin: '0 auto'}}>
                        <div className="table-card" style={{padding: '2rem'}}>
                            <h3 style={{marginBottom: '1.5rem', display:'flex', alignItems:'center', gap:'10px'}}>
                                <Lock size={24} color="var(--primary)"/> Update Admin Credentials
                            </h3>
                            <form onSubmit={handleProfileUpdate}>
                                <div className="detail-section">
                                    <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>Current Password (Required)</label>
                                    <input 
                                        type="password" 
                                        className="modern-input"
                                        placeholder="Enter current password"
                                        value={profileForm.currentPassword}
                                        onChange={e => setProfileForm({...profileForm, currentPassword: e.target.value})}
                                        required
                                        style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid var(--border)', background:'var(--bg-main)', color:'var(--text-main)'}}
                                    />
                                </div>

                                <div className="detail-section" style={{marginTop:'20px'}}>
                                    <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>New Username (Optional)</label>
                                    <input 
                                        type="text" 
                                        className="modern-input"
                                        placeholder="Leave blank to keep current"
                                        value={profileForm.newUsername}
                                        onChange={e => setProfileForm({...profileForm, newUsername: e.target.value})}
                                        style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid var(--border)', background:'var(--bg-main)', color:'var(--text-main)'}}
                                    />
                                </div>

                                <div className="detail-section" style={{marginTop:'20px'}}>
                                    <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>New Password (Optional)</label>
                                    <input 
                                        type="password" 
                                        className="modern-input"
                                        placeholder="Leave blank to keep current"
                                        value={profileForm.newPassword}
                                        onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})}
                                        style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid var(--border)', background:'var(--bg-main)', color:'var(--text-main)'}}
                                    />
                                </div>

                                <button type="submit" className="btn-approve" style={{width:'100%', marginTop:'30px', padding:'12px'}}>
                                    Update Credentials
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    // --- NORMAL TABLES ---
                    <div className="animate-fade-in">
                        <div className="table-card">
                            <div className="table-header-row">
                                <div className="search-box">
                                    <Search size={18}/>
                                    <input type="text" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                                </div>
                                <div className="pagination-info" style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>
                                    Page {pagination.page} of {pagination.totalPages}
                                </div>
                            </div>

                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Applicant Name</th>
                                        <th>Contact</th>
                                        <th>Status</th>
                                        <th style={{textAlign:'center', width:'80px'}}>View</th> 
                                        <th style={{width:'180px'}}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedStudents.length === 0 ? (
                                        <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>No records found.</td></tr>
                                    ) : (
                                        displayedStudents.map(s => (
                                            <tr key={s.student_id}>
                                                <td className="text-content">#{s.student_id}</td>
                                                <td>
                                                    <div className="user-name">{s.first_name} {s.last_name}</div>
                                                    <div className="user-email">{s.email}</div>
                                                </td>
                                                <td className="text-content">{s.mobile || 'N/A'}</td>
                                                <td>
                                                    {s.application_status === 'Approved' && <span className="status-badge active">Enrolled</span>}
                                                    {s.application_status === 'Pending' && <span className="status-badge pending">Pending Review</span>}
                                                    {s.application_status === 'Rejected' && <span className="status-badge rejected">Rejected</span>}
                                                </td>
                                                
                                                <td style={{textAlign:'center'}}>
                                                    <button className="btn-icon-action view" title="View Details" onClick={() => setSelectedStudent(s)} style={{margin:'0 auto'}}>
                                                        <Eye size={20}/>
                                                    </button>
                                                </td>

                                                <td>
                                                    <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                                        {activeTab === 'applications' && (
                                                            <>
                                                                <button className="btn-reject" title="Reject" onClick={() => handleRejectClick(s.student_id, s.first_name)}>Reject</button>
                                                                <button className="btn-approve" title="Approve" onClick={() => handleApproveClick(s.student_id, s.first_name)}>Approve</button>
                                                            </>
                                                        )}

                                                        {activeTab === 'rejected' && (
                                                            <button className="btn-restore" title="Restore" onClick={() => handleRestoreClick(s.student_id, s.first_name)}>
                                                                <Undo2 size={16} style={{marginRight:'4px'}}/> Restore
                                                            </button>
                                                        )}

                                                        {activeTab === 'students' && (
                                                            <button className="btn-icon-action delete" title="Delete" onClick={() => handleDeleteClick(s.student_id)}>
                                                                <Trash2 size={18}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            
                            {/* Pagination Controls */}
                            {pagination.totalPages > 1 && (
                                <div style={{display:'flex', justifyContent:'center', gap:'10px', padding:'15px', borderTop:'1px solid var(--border)'}}>
                                    <button 
                                        className="btn-secondary" 
                                        disabled={pagination.page <= 1}
                                        onClick={() => fetchStudents(pagination.page - 1)}
                                    >Previous</button>
                                    <button 
                                        className="btn-secondary" 
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => fetchStudents(pagination.page + 1)}
                                    >Next</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
      </div>

      {/* --- STUDENT DETAILS MODAL (EXPANDED) --- */}
      {selectedStudent && (
          <div className="admin-modal-overlay" onClick={() => setSelectedStudent(null)}>
              <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                      <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                          <div className="avatar large" style={{background: '#3b82f6', fontSize:'1.5rem'}}>
                              {selectedStudent.first_name?.[0]}
                          </div>
                          <div>
                              <h2 style={{margin:0, fontSize:'1.2rem', color:'var(--text-main)'}}>
                                  {selectedStudent.first_name} {selectedStudent.middle_name} {selectedStudent.last_name}
                              </h2>
                              <span style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>Student ID: #{selectedStudent.student_id}</span>
                          </div>
                      </div>
                      <button className="btn-icon-action" style={{background:'#f1f5f9', color:'#64748b'}} onClick={() => setSelectedStudent(null)}>
                        <X size={24}/>
                      </button>
                  </div>
                  
                  <div className="modal-body">
                      {/* 1. Identity Grid */}
                      <div className="detail-section" style={{marginBottom:'20px'}}>
                          <h5 style={{marginBottom: '10px', color: 'var(--primary)', fontSize: '1rem', fontWeight: '600'}}>Identity & Background</h5>
                          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
                               <div className="detail-row"><label>First Name</label><div>{selectedStudent.first_name}</div></div>
                               <div className="detail-row"><label>Middle Name</label><div>{selectedStudent.middle_name || 'N/A'}</div></div>
                               <div className="detail-row"><label>Last Name</label><div>{selectedStudent.last_name}</div></div>
                               <div className="detail-row"><label>Sex</label><div>{selectedStudent.sex || 'N/A'}</div></div>
                               <div className="detail-row"><label>Date of Birth</label><div>{formatDate(selectedStudent.dob)}</div></div>
                               <div className="detail-row">
    <label>Civil Status</label>
    <div>{selectedStudent.civil_status || selectedStudent.civilStatus || 'N/A'}</div>
</div>
                               <div className="detail-row"><label>Education</label><div>{selectedStudent.education_level || 'N/A'}</div></div>
                               <div className="detail-row"><label>Employment</label><div>{selectedStudent.employment_status || 'N/A'}</div></div>
                          </div>
                      </div>

                      <hr style={{borderColor:'var(--border)', margin:'20px 0'}}/>

                      {/* 2. Address & Contact Grid */}
                      <div className="detail-section" style={{marginBottom:'20px'}}>
                          <h5 style={{marginBottom: '10px', color: 'var(--primary)', fontSize: '1rem', fontWeight: '600'}}>Contact & Address</h5>
                          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
                               <div className="detail-row"><label>Email</label><div>{selectedStudent.email}</div></div>
                               <div className="detail-row"><label>Mobile</label><div>{selectedStudent.mobile || 'N/A'}</div></div>
                               <div className="detail-row"><label>Region</label><div>{selectedStudent.region || 'N/A'}</div></div>
                               <div className="detail-row"><label>Province</label><div>{selectedStudent.province || 'N/A'}</div></div>
                               <div className="detail-row"><label>City</label><div>{selectedStudent.city || 'N/A'}</div></div>
                               <div className="detail-row"><label>Zip Code</label><div>{selectedStudent.zip_code || 'N/A'}</div></div>
                               <div className="detail-row"><label>Country</label><div>{selectedStudent.country || 'N/A'}</div></div>
                          </div>
                      </div>

                      <hr style={{borderColor:'var(--border)', margin:'20px 0'}}/>

                      {/* 3. Documents Section */}
                      <div className="documents-section">
                          <h4 className="section-title" style={{marginBottom: '15px', color: 'var(--primary)', fontSize:'1rem', fontWeight:'600'}}>
                              <FileText size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Submitted Documents
                          </h4>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                              <div className="doc-item">
                                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                      {/* ✅ Uses isImage safe and sound */}
                                      {selectedStudent.id_file && isImage(selectedStudent.id_file) ? (
                                          <SecureImage filename={selectedStudent.id_file} alt="ID" style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px'}}/>
                                      ) : <FileText size={24} color="var(--text-muted)"/>}
                                      <span style={{fontSize: '0.9rem', fontWeight: '600', color:'var(--text-main)'}}>Valid ID</span>
                                  </div>
                                  {selectedStudent.id_file ? (
                                      <a href={getFileUrl(selectedStudent.id_file)} target="_blank" rel="noopener noreferrer"><button className="btn-icon-action view"><ExternalLink size={18}/></button></a>
                                  ) : <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Missing</span>}
                              </div>
                              <div className="doc-item">
                                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                      {selectedStudent.birth_cert_file && isImage(selectedStudent.birth_cert_file) ? (
                                          <SecureImage filename={selectedStudent.birth_cert_file} alt="Cert" style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px'}}/>
                                      ) : <FileText size={24} color="var(--text-muted)"/>}
                                      <span style={{fontSize: '0.9rem', fontWeight: '600', color:'var(--text-main)'}}>Birth Certificate</span>
                                  </div>
                                  {selectedStudent.birth_cert_file ? (
                                      <a href={getFileUrl(selectedStudent.birth_cert_file)} target="_blank" rel="noopener noreferrer"><button className="btn-icon-action view"><ExternalLink size={18}/></button></a>
                                  ) : <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Missing</span>}
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="modal-footer">
                      {selectedStudent.application_status === 'Pending' && (
                           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                               <button className="btn-reject" onClick={() => handleRejectClick(selectedStudent.student_id, selectedStudent.first_name)}>Reject</button>
                               <button className="btn-approve" onClick={() => handleApproveClick(selectedStudent.student_id, selectedStudent.first_name)}>
                                  <CheckCircle size={16} style={{marginRight:'6px'}}/> Approve
                               </button>
                           </div>
                      )}
                      {selectedStudent.application_status === 'Rejected' && (
                           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                               <button className="btn-restore" onClick={() => handleRestoreClick(selectedStudent.student_id, selectedStudent.first_name)}>
                                  <Undo2 size={16} style={{marginRight:'6px'}}/> Restore
                               </button>
                           </div>
                      )}
                      <button className="btn-secondary" onClick={() => setSelectedStudent(null)}>Close</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- ALERT COMPONENT --- */}
      <div className={`alert-wrapper-${alertConfig.type}`}>
          <CustomAlert 
              isOpen={alertConfig.isOpen} 
              type={alertConfig.type} 
              title={alertConfig.title} 
              message={alertConfig.message} 
              onConfirm={alertConfig.onConfirm} 
              onClose={() => setAlertConfig(prev => ({...prev, isOpen: false}))} 
              confirmText={alertConfig.confirmText} 
              cancelText="Cancel" 
          />
      </div>
    </div>
  );
};

export default AdminDashboard;