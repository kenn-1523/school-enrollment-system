'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { logout } from '../../../services/authService'; 
import { 
  Dices, 
  Trophy, 
  LayoutTemplate, 
  Coins, 
  AlertCircle,
  PlayCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';

// Static Data Fallback from your monorepo package
import { coursesData } from '@repo/business-logic'; 
// The Player Modal
import StudentCourseModal from '../../../components/courses/StudentCourseModal';

export default function StudentDashboard() {
  const router = useRouter();
  
  // Auth State
  const [authChecking, setAuthChecking] = useState(true);

  // Data State
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // ✅ 1. SECURITY CHECK (Runs First)
  useEffect(() => {
    const checkAuth = () => {
      // We check for the session flag in localStorage
      const isLoggedIn = localStorage.getItem('isStudentLoggedIn');
      console.log("Dashboard Security Check - isStudentLoggedIn:", isLoggedIn);

      if (isLoggedIn !== 'true') {
        console.log("Unauthorized. Redirecting to Login...");
        router.replace('/student/login');
      } else {
        console.log("Authorized. Loading Dashboard...");
        setAuthChecking(false); // Allow the dashboard to start loading data
      }
    };
    checkAuth();
  }, [router]);

  // ✅ 2. FETCH DATA (Runs only after Security Check passes)
  useEffect(() => {
    if (authChecking) return; // Wait for auth check

    const fetchDashboard = async () => {
      try {
        console.log("Fetching Dashboard Data...");
        // Updated to use the dynamic API_URL
const response = await api.get('/student/dashboard');

        console.log("Data Received:", response.data);
        const data = response.data;
        if (data.student) {
          const rawStatus = data.student.application_status || 'Pending';
          data.student.displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
        }

        setStudent(data.student);
        setCourses(data.courses || []);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            // API Says Token Invalid -> Force Logout
            console.log("Session Expired. Logging out...");
            localStorage.removeItem('isStudentLoggedIn');
            router.push('/student/login');
        } else {
            setError("Unable to load profile. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [authChecking, router]);

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await logout();
      localStorage.removeItem('isStudentLoggedIn');
      window.location.href = '/student/login';
    } catch (err) {
      console.error("Logout failed", err);
      localStorage.removeItem('isStudentLoggedIn'); 
      router.push('/student/login');
    }
  };

  const handleOpenTable = (courseCode) => {
    const dbCourse = courses.find(c => c.course_code === courseCode || c.code === courseCode);
    const fileCourse = coursesData.find(c => c.code === courseCode);

    let finalLessons = [];

    if (dbCourse) {
       if (dbCourse.lessons && Array.isArray(dbCourse.lessons) && dbCourse.lessons.length > 0) {
           finalLessons = dbCourse.lessons;
       } 
       else if (dbCourse.content_html) {
           try {
             const parsed = typeof dbCourse.content_html === 'string' 
                ? JSON.parse(dbCourse.content_html) 
                : dbCourse.content_html;
             finalLessons = parsed.lessons || [];
           } catch (e) {
             console.error("JSON Parse Error", e);
           }
       } 
       else {
           finalLessons = fileCourse?.lessons || [];
       }
    } else {
       finalLessons = fileCourse?.lessons || [];
    }

    const mergedCourse = {
        ...fileCourse,
        ...dbCourse,
        lessons: finalLessons
    };

    setSelectedCourse(mergedCourse);
  };

  // --- RENDER STATES ---

  // 1. Initial Auth Check (Blank or Minimal Loader)
  if (authChecking) {
    return <div className="min-h-screen bg-[#050505]" />; 
  }

  // 2. Data Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-amber-500">
        <Dices className="animate-bounce mb-4" size={48} />
        <p className="tracking-[0.3em] text-xs font-bold uppercase text-zinc-500">Shuffling Deck...</p>
      </div>
    );
  }

  // 3. Error
  if (error || !student) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-red-500 p-6 text-center">
        <AlertCircle size={48} className="mb-4" />
        <h2 className="text-xl font-bold mb-2">Connection Error</h2>
        <p className="text-zinc-400 mb-6">{error || "Profile data missing."}</p>
        <button onClick={handleLogout} className="px-6 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors">
            Return to Login
        </button>
      </div>
    );
  }

  // 4. Pending/Rejected
  if (student.displayStatus === 'Pending' || student.displayStatus === 'Rejected') {
    const isPending = student.displayStatus === 'Pending';
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#121212] border border-amber-900/30 p-10 rounded-xl shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${isPending ? 'bg-amber-500' : 'bg-red-700'}`}></div>
            <div className="flex justify-center mb-6">
                {isPending ? <Clock size={56} className="text-amber-500"/> : <AlertCircle size={56} className="text-red-600"/>}
            </div>
            <h1 className="text-xl font-bold mb-3 uppercase tracking-widest text-white">
                {isPending ? 'Application Under Review' : 'Access Denied'}
            </h1>
            <p className="text-zinc-500 mb-8 text-sm leading-relaxed font-light">
                {isPending 
                  ? "Your application is currently on the Pit Boss's desk. You will be assigned a table once your credentials are approved."
                  : "The administration has declined your application at this time."}
            </p>
            <button onClick={handleLogout} className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-800 uppercase text-[10px] tracking-[0.2em] transition-all">
                Leave Floor
            </button>
        </div>
      </div>
    );
  }

  // 5. Main Dashboard
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-emerald-900 selection:text-white">
      <nav className="border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded text-black shadow-lg shadow-amber-900/20">
                <Dices size={20} strokeWidth={2.5} />
             </div>
             <div className="hidden md:block">
                <h1 className="font-bold text-lg tracking-wider text-white leading-none">CROUPIER<span className="text-amber-500">ACADEMY</span></h1>
                <p className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] mt-1">Dealer Training Portal</p>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-zinc-200">{student.first_name} {student.last_name}</p>
              <div className="flex items-center justify-end gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Floor Active</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="group flex items-center gap-2 text-[10px] font-bold bg-zinc-900 hover:bg-red-950/30 border border-zinc-800 hover:border-red-900/50 px-5 py-2.5 rounded transition-all uppercase tracking-widest text-zinc-400 hover:text-red-500"
            >
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
            <h1 className="text-3xl font-light text-white mb-2">
                Good Evening, <span className="font-bold text-amber-500">{student.first_name}</span>
            </h1>
            <p className="text-zinc-500 text-sm">Your shift begins now. Select a table below to start your training module.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="bg-[#0f0f0f] border border-zinc-800/60 p-5 rounded-lg flex items-center gap-5 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><LayoutTemplate size={64} /></div>
                <div className="h-10 w-10 bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-900/30"><LayoutTemplate size={20}/></div>
                <div>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Assigned Tables</p>
                    <p className="text-2xl font-bold text-white">{courses.length}</p>
                </div>
            </div>
            <div className="bg-[#0f0f0f] border border-zinc-800/60 p-5 rounded-lg flex items-center gap-5 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Coins size={64} /></div>
                <div className="h-10 w-10 bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center border border-amber-900/30"><Coins size={20}/></div>
                <div>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Chip Handling</p>
                    <p className="text-xl font-bold text-white">Pending Eval</p>
                </div>
            </div>
            <div className="bg-[#0f0f0f] border border-zinc-800/60 p-5 rounded-lg flex items-center gap-5 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Trophy size={64} /></div>
                <div className="h-10 w-10 bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center border border-blue-900/30"><Trophy size={20}/></div>
                <div>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Dealer Rank</p>
                    <p className="text-xl font-bold text-white">Trainee</p>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <LayoutTemplate size={18} className="text-amber-500"/>
            <h2 className="text-lg font-bold text-white tracking-widest uppercase">Active Tables</h2>
        </div>

        {courses.length === 0 ? (
          <div className="py-20 border border-dashed border-zinc-800 bg-zinc-900/20 rounded-xl text-center flex flex-col items-center">
            <div className="bg-zinc-800/50 p-4 rounded-full mb-4"><LayoutTemplate size={32} className="text-zinc-600" /></div>
            <h3 className="text-lg font-semibold text-white mb-2">No Tables Assigned</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-6">
                You are currently not assigned to any game tables. Please report to the Pit Boss.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((courseItem, index) => (
              <div 
                key={courseItem.course_code || index} 
                onClick={() => handleOpenTable(courseItem.course_code || courseItem.code)} 
                className={`group relative bg-[#121212] border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/10 cursor-pointer flex flex-col h-full transform hover:-translate-y-1 
                ${courseItem.status === 'Completed' ? 'border-emerald-500/30' : 'border-zinc-800 hover:border-emerald-600/30'}`}
              >
                <div className={`h-1 w-full transition-colors ${courseItem.status === 'Completed' ? 'bg-emerald-500' : 'bg-zinc-800 group-hover:bg-emerald-600'}`}></div>
                
                <div className="p-7 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        {/* STATUS BADGE */}
                        <div className={`text-[9px] font-bold px-2 py-1 rounded border tracking-widest uppercase ${
                             courseItem.status === 'Completed' 
                             ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50'
                             : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                        }`}>
                            {courseItem.status || 'In Progress'}
                        </div>
                        
                        {/* GRADE BADGE */}
                        {courseItem.grade && courseItem.grade !== 'N/A' && (
                            <div className="flex items-center gap-1 bg-amber-900/20 text-amber-500 px-2 py-1 rounded border border-amber-900/30 text-[10px] font-bold">
                                <Trophy size={12} />
                                <span>{courseItem.grade}</span>
                            </div>
                        )}
                    </div>

                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-emerald-400 transition-colors">
                      {courseItem.title || coursesData.find(c => c.code === (courseItem.course_code || courseItem.code))?.title || "Unknown Course"}
                    </h3>
                    <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                       {courseItem.description || coursesData.find(c => c.code === (courseItem.course_code || courseItem.code))?.desc || "Complete dealer procedures and game protection protocols."}
                    </p>
                </div>

                <div className="bg-[#0a0a0a] px-7 py-4 border-t border-zinc-800 group-hover:border-emerald-900/30 flex justify-between items-center mt-auto">
                    <span className="text-[10px] text-zinc-600 font-mono tracking-wider">MODULE 01</span>
                    <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest">
                        {courseItem.status === 'Completed' ? (
                            <>Review <CheckCircle2 size={14} className="text-emerald-500"/></>
                        ) : (
                            <>Enter Table <PlayCircle size={14} className="text-amber-500"/></>
                        )}
                    </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <StudentCourseModal 
        course={selectedCourse} 
        isOpen={!!selectedCourse} 
        onClose={() => setSelectedCourse(null)}
      />

    </div>
  );
}