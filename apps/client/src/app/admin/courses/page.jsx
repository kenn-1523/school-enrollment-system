'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { Edit } from 'lucide-react';

// ✅ CORRECT PATHS
import { useAuth } from '../../../context/AuthContext';
import CourseEditorModal from '../../../components/admin/CourseEditorModal';
import AdminSidebar from '../../../components/admin/AdminSidebar';

const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: '#0f172a',
  color: '#e2e8f0',
};

// API calls use centralized `api` from src/lib/apiClient

export default function AdminCoursesPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin && !authLoading) return;

    const fetchData = async () => {
      try {
        // ✅ FIXED PATH: /api/admin/courses
        const res = await api.get('/api/admin/courses');

        if (res.data && res.data.success) {
          setCourses(res.data.courses || []);
        } else if (Array.isArray(res.data)) {
          // fallback if API returns raw array
          setCourses(res.data);
        } else if (res.data && Array.isArray(res.data.courses)) {
          setCourses(res.data.courses);
        }
      } catch (err) {
        console.error('Admin Load Error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, authLoading]);

  if (authLoading)
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-amber-500">
        Checking Access...
      </div>
    );

  return (
    <div style={layoutStyle}>
      {/* Sidebar with 'courses' active */}
      <AdminSidebar activeTab="courses" />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <header
          style={{
            height: '70px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            padding: '0 30px',
            background: '#1e293b',
          }}
        >
          <h1 className="font-bold text-lg tracking-wider text-white">Course Management</h1>
          <div
            style={{
              marginLeft: 'auto',
              background: '#334155',
              padding: '5px 12px',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            Total Courses:{' '}
            <span className="font-bold text-white ml-2">{courses.length}</span>
          </div>
        </header>

        <div className="p-8">
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-800 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Course Title</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr key="loading">
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-600">
                      Loading courses...
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr key="empty">
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-600">
                      No courses found.
                    </td>
                  </tr>
                ) : (
                  courses.map((course, index) => (
                    <tr
                      key={course.id || course.course_code || index}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-blue-400">
                        {course.course_code || course.code}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {course.title}
                      </td>
                      <td className="px-6 py-4">${course.price}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCourseCode(course.course_code || course.code)}
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-xs transition-colors shadow-lg shadow-blue-900/20"
                        >
                          <Edit size={14} /> Edit Content
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {selectedCourseCode && (
        <CourseEditorModal
          courseCode={selectedCourseCode}
          isOpen={!!selectedCourseCode}
          onClose={() => setSelectedCourseCode(null)}
        />
      )}
    </div>
  );
}
