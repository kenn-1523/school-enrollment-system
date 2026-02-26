'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import { Lock, Save } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

// ✅ FIXED: Added quotes around the URL string so the build doesn't crash
// centralized API client

export default function SettingsPanel({ triggerAlert }) {
  // NOTE: your AuthContext might expose different keys (user/admin).
  // We try common ones safely.
  const auth = useAuth();
  const logout = auth?.logout;
  const currentUsername =
    auth?.user?.username ||
    auth?.admin?.username ||
    auth?.user?.name ||
    auth?.admin?.name ||
    ''; // fallback: empty (we’ll enforce required in UI)

  const [form, setForm] = useState({
    currentPassword: '',
    username: '',       // ✅ this is the actual backend field name
    newPassword: ''     // optional
  });

  const [loading, setLoading] = useState(false);

  // ✅ Prefill username so backend requirement is satisfied even if user only changes password
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      username: prev.username || currentUsername || ''
    }));
  }, [currentUsername]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    triggerAlert(
      'info',
      'Update Credentials',
      'You are about to change your login details. You will be logged out.',
      'Proceed',
      async () => {
        setLoading(true);
        try {
          const username = (form.username || '').trim();
          const password = (form.newPassword || '').trim();

          // ✅ Follow backend: username must exist
          if (!username) {
            alert('Username is required');
            setLoading(false);
            return;
          }

          const payload = {
            username,
            // ✅ only include password if user typed one
            ...(password ? { password } : {}),
            // kept only if you later decide to validate it in backend
            currentPassword: form.currentPassword
          };

          await api.put('/admin/update-profile', payload);

          // backend says you will be logged out after change — do it here
          if (typeof logout === 'function') logout();
        } catch (err) {
          alert(err.response?.data?.message || 'Update failed');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-8 shadow-xl">
        <h3 className="flex items-center gap-3 text-xl font-bold text-white mb-8 border-b border-slate-700 pb-4">
          <Lock className="text-blue-500" /> Admin Security
        </h3>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Current Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
              placeholder="••••••••"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Username
              </label>
              <input
                type="text"
                required
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                New Password (Optional)
              </label>
              <input
                type="password"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                placeholder="New password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
            >
              <Save size={18} /> {loading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}