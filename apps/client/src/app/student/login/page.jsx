'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Import your service
import { loginStudent } from '../../../services/authService';

export default function StudentLoginPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // ✅ 1. CHECK IF ALREADY LOGGED IN (On Mount)
  useEffect(() => {
    const checkSession = () => {
      const isLoggedIn = localStorage.getItem('isStudentLoggedIn');
      console.log("Login Page Check - isStudentLoggedIn:", isLoggedIn);

      if (isLoggedIn === 'true') {
        console.log("User already logged in. Redirecting to Dashboard...");
        router.replace('/student/dashboard');
      } else {
        setIsChecking(false); // Allow showing the form
      }
    };
    
    checkSession();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log("Attempting Login for:", formData.username);

    try {
      // 1. Call Backend (Sets the httpOnly cookie)
      await loginStudent(formData.username, formData.password);
      console.log("Backend Login Success.");
      
      // 2. Set the LocalStorage Flag (CRITICAL)
      localStorage.setItem('isStudentLoggedIn', 'true');
      console.log("LocalStorage Flag Set: true");
      
      // 3. Force Redirect
      console.log("Redirecting to Dashboard...");
      router.push('/student/dashboard');
      
    } catch (err) {
      console.error("Login Failed:", err);
      if (err.message && err.message.toLowerCase().includes('pending')) {
        setError('⚠️ Your account is waiting for Admin approval.');
      } else {
        setError(err.message || '❌ Invalid login credentials.');
      }
      setIsLoading(false);
    }
  };

  // Prevent flash while checking session
  if (isChecking) {
      return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading Portal...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-sans">
      <div className="w-full max-w-md p-8 bg-zinc-900 border border-yellow-600/20 rounded-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700"></div>
        <div className="text-center mb-8 mt-2">
          <h1 className="text-2xl font-bold text-yellow-500 uppercase tracking-widest">
            Student Portal
          </h1>
          <p className="text-zinc-500 text-sm mt-2">Access your training modules</p>
        </div>

        {error && (
          <div className={`mb-6 p-4 border text-sm rounded-lg text-center animate-pulse ${
            error.includes('waiting') 
              ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-200' 
              : 'bg-red-900/20 border-red-500/50 text-red-200'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-yellow-500/80 mb-2 uppercase tracking-wider">Username</label>
            <input type="text" name="username" required className="w-full bg-black/40 border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors placeholder-zinc-700" placeholder="Enter your username" onChange={handleChange} />
          </div>
          <div>
            <label className="block text-xs font-bold text-yellow-500/80 mb-2 uppercase tracking-wider">Password</label>
            <input type="password" name="password" required className="w-full bg-black/40 border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors placeholder-zinc-700" placeholder="••••••••" onChange={handleChange} />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold py-3.5 rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-900/20">
            {isLoading ? 'AUTHENTICATING...' : 'LOGIN NOW'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-600 border-t border-zinc-800 pt-6">
          New student?{' '}
          <Link href="/enroll" className="text-yellow-500 hover:text-yellow-400 font-medium ml-1 hover:underline">Apply for Enrollment</Link>
        </div>
      </div>
    </div>
  );
}