'use client';

import React, { useMemo } from 'react';
import { Search, BookOpen } from 'lucide-react';

export default function EnrolledTable({
  data = [],
  loading = false,
  searchQuery = '',
  setSearchQuery = () => {},
  onRowClick
}) {
  
  const filteredData = useMemo(() => {
    const q = String(searchQuery || '').trim().toLowerCase();
    if (!q) return data;
    return (data || []).filter((row) => {
      return String(row.student_name || '').toLowerCase().includes(q) ||
             String(row.student_id || '').toLowerCase().includes(q);
    });
  }, [data, searchQuery]);

  return (
    <div className="bg-[#1e293b] rounded-xl shadow border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Enrolled Students</h2>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student..."
            className="w-full pl-9 pr-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="enrolled-table min-w-full text-left text-sm">
          <thead>
            <tr className="bg-[#0f172a] border-b border-slate-700">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Courses Active</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/50">
            {loading ? (
              <tr><td colSpan={4} className="text-center p-8 text-slate-500">Loading data...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={4} className="text-center p-8 text-slate-500">No students found.</td></tr>
            ) : (
              filteredData.map((row, index) => (
                <tr
                  key={`${row.student_id}-${index}`}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(row)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-200">
                      {row.student_name || `Student #${row.student_id}`}
                    </div>
                    <div className="text-xs text-slate-500">{row.email}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-blue-400">#{row.student_id}</div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                      {row.courseCount || 1} Courses
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right align-middle">
                    <button
                      onClick={(e) => { e.stopPropagation(); onRowClick?.(row); }}
                      className="px-3 py-1.5 text-xs font-bold rounded bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                    >
                      View Report
                    </button>
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