'use client';

import React from 'react';
import axios from 'axios';
import { Search, CheckCircle, XCircle, FileText } from 'lucide-react';

// Keep this consistent with AdminDashboard.jsx
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

export default function ApplicationsTable({ data, loading, searchQuery, setSearchQuery, refreshData, triggerAlert, onRowClick }) {

  const handleApprove = (e, id) => {
    e.stopPropagation();
    triggerAlert('success', 'Approve Application', 'Are you sure you want to approve this student?', 'Approve', async () => {
      try {
        await axios.post(`${API_URL}/api/admin/approve`, { studentId: id }, { withCredentials: true });
        refreshData();
      } catch (err) { alert("Error approving"); }
    });
  };

  const handleReject = (e, id) => {
    e.stopPropagation();
    triggerAlert('warning', 'Reject Application', 'This will reject the application. Continue?', 'Reject', async () => {
      try {
        await axios.post(`${API_URL}/api/admin/reject`, { studentId: id }, { withCredentials: true });
        refreshData();
      } catch (err) { alert("Error rejecting"); }
    });
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            className="w-full bg-[#0f172a] border border-slate-700 text-slate-200 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 text-sm"
            placeholder="Search applicants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-[#0f172a] border border-slate-700 rounded-lg">
          <span className="text-xs font-bold text-slate-500 uppercase">Pending</span>
          <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">{data.length}</span>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f172a] border-b border-slate-700">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Applicant</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type / Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Courses</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Documents</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {loading ? (
              <tr><td colSpan="6" className="text-center p-8 text-slate-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="6" className="text-center p-8 text-slate-500">No pending applications found.</td></tr>
            ) : (
              data.map((s) => (
                <tr
                  key={s.student_id}
                  onClick={() => onRowClick(s)}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">#{s.student_id}</td>

                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">
                      {s.first_name} {s.last_name}
                    </div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.mobile || 'N/A'}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded w-fit ${
                        s.scholarship_type === 'Scholarship' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {s.scholarship_type || 'Paying'}
                      </span>
                      <span className="text-xs text-slate-400">Start: {s.start_date || 'TBA'}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {s.applied_courses ? s.applied_courses.split(', ').map((code, i) => (
                        <span key={i} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">
                          {code}
                        </span>
                      )) : <span className="text-slate-600 text-xs italic">No courses</span>}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {s.id_file ? <FileText size={16} className="text-emerald-500" title="ID Uploaded" /> : <FileText size={16} className="text-slate-700" title="Missing ID" />}
                      {s.birth_cert_file ? <FileText size={16} className="text-emerald-500" title="Birth Cert Uploaded" /> : <FileText size={16} className="text-slate-700" title="Missing Birth Cert" />}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => handleReject(e, s.student_id)} className="p-2 rounded hover:bg-red-500/20 text-red-500"><XCircle size={18} /></button>
                      <button onClick={(e) => handleApprove(e, s.student_id)} className="p-2 rounded hover:bg-emerald-500/20 text-emerald-500"><CheckCircle size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
