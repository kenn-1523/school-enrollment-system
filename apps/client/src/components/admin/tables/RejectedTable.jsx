'use client';

import React from 'react';
import { api } from '@/lib/apiClient';
import { Search, Undo2, Ban } from 'lucide-react';



export default function RejectedTable({ data, loading, searchQuery, setSearchQuery, refreshData, triggerAlert, onRowClick }) {

  const handleRestore = (e, id) => {
    e.stopPropagation();
    triggerAlert('info', 'Restore Application', 'Move this application back to Pending?', 'Restore', async () => {
      try {
        await api.post('/admin/restore', { studentId: id });
        refreshData();
      } catch (err) { alert("Error restoring"); }
    });
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            className="w-full bg-[#0f172a] border border-slate-700 text-slate-200 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 text-sm"
            placeholder="Search rejected history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-[#0f172a] border border-slate-700 rounded-lg">
          <Ban size={16} className="text-red-500" />
          <span className="text-xs font-bold text-slate-500 uppercase">Rejected</span>
          <span className="text-xs font-bold text-red-100 bg-red-600 px-2 py-0.5 rounded-full">{data.length}</span>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f172a] border-b border-slate-700">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Applicant</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Reason</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {loading ? (
              <tr><td colSpan="5" className="text-center p-8 text-slate-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="5" className="text-center p-8 text-slate-500">No rejected applications found.</td></tr>
            ) : (
              data.map((s, index) => (
                <tr
                  key={`${s.student_id}-${index}`}
                  onClick={() => onRowClick(s)}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">#{s.student_id}</td>
                  <td className="px-6 py-4 font-bold text-slate-200 group-hover:text-red-400 transition-colors">{s.first_name} {s.last_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic">Criteria not met</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20 uppercase">Rejected</span></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={(e) => handleRestore(e, s.student_id)} className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold ml-auto"><Undo2 size={14} /> Restore</button>
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
