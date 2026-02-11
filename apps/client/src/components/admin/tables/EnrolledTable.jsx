'use client';

import React, { useMemo } from 'react';
import axios from 'axios';
import { Search, Users } from 'lucide-react';

// Keep this consistent with AdminDashboard.jsx
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * data shape expected:
 * [
 *   {
 *     student_id: 27,
 *     full_name: "Mario Denatil",
 *     start_date: "2026-11-11",
 *     modules: [
 *        { course_code, course_title, total_lessons, completed_lessons, progress_percent, avg_quiz_score, last_completed_at, status }
 *     ]
 *   }
 * ]
 */
export default function EnrolledTable({
  data = [],
  loading = false,
  searchQuery = '',
  setSearchQuery = () => {},
  refreshData = () => {},
  triggerAlert,
  onRowClick
}) {
  // Optional delete (keep if you still use it somewhere)
  const handleDelete = (e, studentId) => {
    e.stopPropagation();
    if (!triggerAlert) return;

    triggerAlert(
      'logout',
      'Delete Student',
      'This action is permanent. Are you sure you want to delete this student?',
      'Delete',
      async () => {
        try {
          await axios.delete(`${API_URL}/api/admin/students/${studentId}`, { withCredentials: true });
          refreshData();
        } catch (err) {
          console.error('Error deleting:', err);
          alert('Error deleting student');
        }
      }
    );
  };

  const filteredData = useMemo(() => {
    const q = String(searchQuery || '').trim().toLowerCase();
    if (!q) return data;

    return (data || []).filter((student) => {
      const idMatch = String(student.student_id || '').toLowerCase().includes(q);
      const nameMatch = String(student.full_name || '').toLowerCase().includes(q);
      return idMatch || nameMatch;
    });
  }, [data, searchQuery]);

  return (
    <div className="bg-[#1e293b] rounded-xl shadow border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Enrolled Module Progress</h2>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student ID or name..."
            className="w-full pl-9 pr-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="bg-[#0f172a] border-b border-slate-700">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Modules</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Progress</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Score</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/50">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-slate-500">
                  No enrolled students found.
                </td>
              </tr>
            ) : (
              filteredData.map((student) => {
                const modules = student.modules || [];

                const totalLessons = modules.reduce((sum, m) => sum + Number(m.total_lessons || 0), 0);
                const completedLessons = modules.reduce((sum, m) => sum + Number(m.completed_lessons || 0), 0);
                const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                const scored = modules.filter((m) => m.avg_quiz_score != null);
                const avgScore =
                  scored.length > 0
                    ? scored.reduce((sum, m) => sum + Number(m.avg_quiz_score || 0), 0) / scored.length
                    : null;

                return (
                  <tr
                    key={student.student_id}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => onRowClick?.(student)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-200">
                        {student.full_name || `Student #${student.student_id}`}
                      </div>
                      <div className="font-mono text-xs text-blue-400">#{student.student_id}</div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-300">{student.start_date || 'N/A'}</td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-200">{modules.length} modules</div>
                      <div className="text-xs text-slate-500">
                        {completedLessons}/{totalLessons} lessons done
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-700 rounded-full h-1.5 max-w-[160px]">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{overallProgress}%</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-300">
                      {avgScore == null ? '—' : avgScore.toFixed(1)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick?.(student);
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 text-white"
                      >
                        View Progress
                      </button>

                      {/* Optional delete button (uncomment if needed)
                      <button
                        onClick={(e) => handleDelete(e, student.student_id)}
                        className="ml-2 px-3 py-1.5 text-xs font-bold rounded bg-red-600 hover:bg-red-500 text-white"
                      >
                        Delete
                      </button>
                      */}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
