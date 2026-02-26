'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/apiClient';
import {
  X,
  PlayCircle,
  BookOpen,
  Lock,
  ChevronLeft,
  ChevronRight,
  Menu,
  CheckCircle,
  FileText,
  Award,
  AlertCircle,
  Trophy,
  Timer,
  AlertTriangle
} from 'lucide-react';

// ✅ MONOREPO SAFE IMPORT
import { useTheme } from '../../context/ThemeContext';

/**
 * ✅ ENV STRATEGY
 *
 * Configure the API base via environment variable:
 *   NEXT_PUBLIC_API_URL=https://api-croupiertraining.sgwebworks.com
 *
 * IMPORTANT:
 * - use string fallback in quotes
 * - normalize trailing slash
 */
export default function StudentCourseModal({ course, isOpen, onClose }) {
  // --- STATE ---
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // ✅ PROGRESS STATE
  const [maxUnlockedIndex, setMaxUnlockedIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // ✅ UX STATE
  const [shakeId, setShakeId] = useState(null);

  // ✅ QUIZ ENGINE STATE
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizPassed, setQuizPassed] = useState(false);

  // 🔥 PROCTORING STATE (Dynamic Time)
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showCheatingWarning, setShowCheatingWarning] = useState(false);

  // API calls use centralized `api` client

  // --- THEME SAFEGUARD ---
  let isDarkMode = true;
  try {
    const themeContext = useTheme();
    if (themeContext && (themeContext.theme === 'dark' || themeContext.isDarkMode)) {
      isDarkMode = true;
    } else if (themeContext && (themeContext.theme === 'light' || themeContext.isDarkMode === false)) {
      isDarkMode = false;
    }
  } catch (err) {
    // ThemeContext may not exist in some renders
    console.warn('ThemeContext default used.');
  }

  // --- INIT & PERSISTENCE ---
  useEffect(() => {
    if (isOpen && course) {
      document.body.style.overflow = 'hidden';

      const savedProgress = localStorage.getItem(`progress_${course.code}`);
      if (savedProgress) {
        const parsed = parseInt(savedProgress, 10);
        const safeParsed = Number.isFinite(parsed) ? parsed : 0;
        setMaxUnlockedIndex(safeParsed);
        setActiveLessonIndex(safeParsed);
      } else {
        setActiveLessonIndex(0);
        setMaxUnlockedIndex(0);
      }
    } else {
      document.body.style.overflow = 'auto';
      resetQuizState();
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, course]);

  // Save Progress
  useEffect(() => {
    if (course && typeof maxUnlockedIndex === 'number' && maxUnlockedIndex >= 0) {
      localStorage.setItem(`progress_${course.code}`, maxUnlockedIndex.toString());
    }
  }, [maxUnlockedIndex, course]);

  // Reset when lesson changes
  useEffect(() => {
    const contentArea = document.getElementById('lesson-content-area');
    if (contentArea) contentArea.scrollTop = 0;
    resetQuizState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLessonIndex]);

  // 🔥 ANTI-CHEAT: VISIBILITY DETECTOR
  useEffect(() => {
    if (!isQuizActive || quizSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            handleSubmitQuiz(true); // Force fail after 3 attempts
          } else {
            setShowCheatingWarning(true);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQuizActive, quizSubmitted]);

  // ⏱️ TIMER LOGIC
  useEffect(() => {
    if (!isQuizActive || quizSubmitted || timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          handleSubmitQuiz(); // Auto submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQuizActive, timeLeft, quizSubmitted]);

  // --- HELPER FUNCTIONS ---
  const resetQuizState = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizPassed(false);
    setIsQuizActive(false);
    setTimeLeft(0);
    setTabSwitchCount(0);
    setShowCheatingWarning(false);
  };

  const startQuiz = () => {
    const activeLesson = (course?.lessons || [])[activeLessonIndex];
    const dbTimeLimit = activeLesson?.time_limit ? Number(activeLesson.time_limit) : 10;
    const safeMinutes = Number.isFinite(dbTimeLimit) && dbTimeLimit > 0 ? dbTimeLimit : 10;

    setTimeLeft(safeMinutes * 60);
    setIsQuizActive(true);
    setTabSwitchCount(0);
    setShowCheatingWarning(false);
  };

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- HANDLERS ---
  const handleNext = () => {
    const lessonsLen = (course?.lessons || []).length;

    if (lessonsLen === 0) return;

    if (activeLessonIndex === lessonsLen - 1) {
      setIsCompleted(true);
      return;
    }

    if (activeLessonIndex < lessonsLen - 1) {
      const nextIndex = activeLessonIndex + 1;
      setActiveLessonIndex(nextIndex);
      if (nextIndex > maxUnlockedIndex) setMaxUnlockedIndex(nextIndex);
    }
  };

  const handlePrev = () => {
    if (activeLessonIndex > 0) {
      setActiveLessonIndex((prev) => prev - 1);
      setIsCompleted(false);
    }
  };

  const handleLockedClick = (idx) => {
    setShakeId(idx);
    setTimeout(() => setShakeId(null), 500);
  };

  const handleQuizSelect = (questionId, option) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  /**
   * ✅ SERVER-SIDE SUBMISSION (works local + prod)
   * Uses API_URL from env.
   *
   * NOTE about withCredentials:
   * - Keep if your backend auth uses cookies/session.
   * - If you use JWT in Authorization header, remove withCredentials.
   */
  const handleSubmitQuiz = async (forceFail = false) => {
    const activeLesson = (course?.lessons || [])[activeLessonIndex];
    if (!activeLesson) return;

    if (forceFail) {
      setQuizScore(0);
      setQuizSubmitted(true);
      setQuizPassed(false);
      return;
    }

    try {
      const response = await api.post(
        '/student/quiz/submit',
        {
          lessonId: activeLesson.id,
          answers: quizAnswers
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 20000
        }
      );

      const { passed, score } = response.data || {};

      setQuizScore(typeof score === 'number' ? score : 0);
      setQuizSubmitted(true);
      setQuizPassed(!!passed);

      if (passed) {
        const lessonsLen = (course?.lessons || []).length;
        if (activeLessonIndex < lessonsLen - 1) {
          const nextIndex = activeLessonIndex + 1;
          if (nextIndex > maxUnlockedIndex) setMaxUnlockedIndex(nextIndex);
        }
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Connection Error. Please check your network and try again.';
      alert(message);
    }
  };

  if (!isOpen || !course) return null;

  const lessons = course.lessons || [];
  const activeLesson = lessons[activeLessonIndex];
  const hasLessons = lessons.length > 0;

  const activeQuizzes = activeLesson?.quizzes || [];
  const hasQuiz = activeQuizzes.length > 0;

  // --- STYLES ---
  const styles = isDarkMode
    ? {
        bgMain: 'bg-[#050505]',
        bgSidebar: 'bg-[#0a0a0a]',
        bgHeader: 'bg-[#0a0a0a]',
        border: 'border-zinc-800',
        textPrimary: 'text-white',
        textSecondary: 'text-zinc-400',
        textMuted: 'text-zinc-500',
        hoverBg: 'hover:bg-zinc-800',
        activeItem: 'bg-emerald-900/10 border-emerald-500',
        activeNumber: 'bg-emerald-500 text-black',
        inactiveNumber: 'bg-zinc-800 text-zinc-500',
        lockedItem: 'opacity-40 cursor-not-allowed grayscale',
        quizCard: 'bg-[#0f0f0f] border-zinc-800',
        quizOption: 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800',
        quizSelected: 'border-emerald-500 bg-emerald-900/20 text-white',
        quizCorrect: 'border-emerald-500 bg-emerald-900/30',
        quizWrong: 'border-red-500 bg-red-900/30',
        icon: 'text-zinc-400',
        divider: 'bg-zinc-800'
      }
    : {
        bgMain: 'bg-white',
        bgSidebar: 'bg-zinc-50',
        bgHeader: 'bg-white',
        border: 'border-zinc-200',
        textPrimary: 'text-zinc-900',
        textSecondary: 'text-zinc-600',
        textMuted: 'text-zinc-400',
        hoverBg: 'hover:bg-zinc-200',
        activeItem: 'bg-emerald-50 border-emerald-500',
        activeNumber: 'bg-emerald-500 text-white',
        inactiveNumber: 'bg-zinc-200 text-zinc-500',
        lockedItem: 'opacity-40 cursor-not-allowed grayscale',
        quizCard: 'bg-white border-zinc-200 shadow-sm',
        quizOption: 'bg-zinc-50 border-zinc-300 hover:bg-zinc-100',
        quizSelected: 'border-emerald-500 bg-emerald-50 text-black',
        quizCorrect: 'border-emerald-500 bg-emerald-100',
        quizWrong: 'border-red-500 bg-red-100',
        icon: 'text-zinc-600',
        divider: 'bg-zinc-200'
      };

  // 🔒 LOCKDOWN VIEW (When Quiz is Active)
  if (isQuizActive) {
    return (
      <div
        className={`fixed inset-0 z-[60] flex flex-col items-center justify-center ${styles.bgMain} ${styles.textPrimary}`}
      >
        {/* CHEATING WARNING */}
        {showCheatingWarning && !quizSubmitted && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce z-50">
            <AlertTriangle size={24} className="fill-white text-red-600" />
            <div>
              <p className="font-bold uppercase tracking-widest text-xs">Anti-Cheat Warning</p>
              <p className="text-sm">
                Tab switching detected ({tabSwitchCount}/3). Focus on the quiz.
              </p>
            </div>
            <button
              onClick={() => setShowCheatingWarning(false)}
              className="ml-4 bg-white/20 p-1 rounded-full"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="w-full max-w-4xl h-full flex flex-col p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Lock className="text-emerald-500" />
                Quiz Mode Active
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Course content is hidden during assessment.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                  timeLeft < 60
                    ? 'border-red-500 text-red-500'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                <Timer size={18} />
                <span className="font-mono text-xl font-bold">{formatTime(timeLeft)}</span>
              </div>

              {!quizSubmitted && (
                <button
                  onClick={() => setIsQuizActive(false)}
                  className="text-zinc-500 hover:text-white text-sm underline"
                >
                  Cancel Quiz
                </button>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
            {activeQuizzes.map((q, qIdx) => {
              let options = [];
              try {
                options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
              } catch (e) {
                options = [];
              }

              return (
                <div key={q.id} className="mb-8 border-b border-zinc-800/50 pb-8">
                  <p className="font-semibold mb-4 text-lg">
                    <span className="text-emerald-500 mr-2">{qIdx + 1}.</span> {q.question}
                  </p>

                  <div className="grid gap-3">
                    {options.map((opt, oIdx) => {
                      const selected = quizAnswers[q.id] === opt;

                      let cls = styles.quizOption;

                      if (quizSubmitted) {
                        if (opt === q.correct_answer) cls = styles.quizCorrect;
                        else if (selected && opt !== q.correct_answer) cls = styles.quizWrong;
                      } else if (selected) {
                        cls = styles.quizSelected;
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleQuizSelect(q.id, opt)}
                          disabled={quizSubmitted}
                          className={`w-full text-left p-4 rounded-lg border transition-all text-sm flex items-center justify-between ${cls}`}
                        >
                          <span>{opt}</span>
                          {selected && !quizSubmitted && (
                            <CheckCircle size={16} className="text-emerald-500" />
                          )}
                          {quizSubmitted && opt === q.correct_answer && (
                            <CheckCircle size={16} className="text-emerald-600" />
                          )}
                          {quizSubmitted && selected && opt !== q.correct_answer && (
                            <AlertCircle size={16} className="text-red-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-between items-center">
            {!quizSubmitted ? (
              <button
                onClick={() => handleSubmitQuiz()}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg"
              >
                Submit Assessment
              </button>
            ) : (
              <div className="w-full flex justify-between items-center">
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold">Score</p>
                  <p
                    className={`text-3xl font-bold ${
                      quizPassed ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {quizScore} / {activeQuizzes.length}
                  </p>
                </div>

                <button
                  onClick={() => setIsQuizActive(false)}
                  className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
                >
                  Return to Lesson
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STANDARD COURSE VIEW
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col font-sans transition-colors duration-300 ${styles.bgMain} ${styles.textPrimary}`}
    >
      {/* 1. TOP BAR */}
      <header
        className={`h-16 border-b ${styles.border} ${styles.bgHeader} flex items-center justify-between px-6 shrink-0 relative z-30`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${styles.icon} ${styles.hoverBg} hover:text-emerald-500`}
          >
            <X size={24} />
          </button>

          <div className={`h-8 w-[1px] ${styles.divider} hidden md:block`}></div>

          <div>
            <h1 className={`text-sm font-bold ${styles.textPrimary} uppercase hidden md:block`}>
              {course.title}
            </h1>
            <p
              className={`text-[10px] ${styles.textMuted} uppercase tracking-widest flex items-center gap-2`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE TRAINING • {course.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end w-32">
            <div
              className={`flex justify-between w-full text-[9px] ${styles.textMuted} uppercase tracking-wider mb-1`}
            >
              <span>Progress</span>
              <span>
                {lessons.length > 0
                  ? Math.round(((maxUnlockedIndex + 1) / lessons.length) * 100)
                  : 0}
                %
              </span>
            </div>

            <div className={`w-full h-1 ${styles.divider} rounded-full overflow-hidden`}>
              <div
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{
                  width:
                    lessons.length > 0 ? `${((maxUnlockedIndex + 1) / lessons.length) * 100}%` : '0%'
                }}
              ></div>
            </div>
          </div>

          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className={`md:hidden p-2 ${styles.icon}`}>
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <aside
          className={`${isSidebarOpen ? 'w-full md:w-80 border-r' : 'w-0 border-none'} ${
            styles.bgSidebar
          } ${styles.border} flex flex-col transition-all duration-300 absolute md:relative z-20 h-full`}
        >
          <div className={`p-5 border-b ${styles.border} ${styles.bgSidebar}`}>
            <h3
              className={`text-xs font-bold ${styles.textMuted} uppercase tracking-widest flex items-center gap-2`}
            >
              <BookOpen size={14} /> Module Lessons
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {hasLessons ? (
              <div className="flex flex-col gap-1">
                {lessons.map((lesson, idx) => {
                  const isActive = idx === activeLessonIndex && !isCompleted;
                  const isQuizLesson = lesson.quizzes && lesson.quizzes.length > 0;
                  const isLocked = idx > maxUnlockedIndex;
                  const isShake = shakeId === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!isLocked) {
                          setActiveLessonIndex(idx);
                          setIsCompleted(false);
                        } else {
                          handleLockedClick(idx);
                        }
                      }}
                      className={`text-left p-3 rounded-lg transition-all duration-200 flex gap-3 border relative overflow-hidden ${
                        isActive ? styles.activeItem : `${styles.hoverBg} border-transparent`
                      } ${isLocked ? styles.lockedItem : ''} ${
                        isShake ? 'animate-shake bg-red-900/10 border-red-900/30' : ''
                      }`}
                    >
                      <style jsx>{`
                        @keyframes shake {
                          0%,
                          100% {
                            transform: translateX(0);
                          }
                          25%,
                          75% {
                            transform: translateX(-4px);
                          }
                          50% {
                            transform: translateX(4px);
                          }
                        }
                        .animate-shake {
                          animation: shake 0.4s ease-in-out;
                        }
                      `}</style>

                      <div
                        className={`shrink-0 h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold mt-0.5 transition-colors ${
                          isActive ? styles.activeNumber : styles.inactiveNumber
                        }`}
                      >
                        {isLocked ? <Lock size={10} /> : isQuizLesson ? 'Q' : lesson.lessonNumber || 'i'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-sm font-medium leading-snug mb-1 truncate transition-colors ${
                            isActive ? styles.textPrimary : styles.textSecondary
                          }`}
                        >
                          {lesson.title}
                        </h4>

                        <span className={`text-[10px] ${styles.textMuted} flex items-center gap-1`}>
                          {isLocked ? (
                            <span className="text-zinc-600 font-semibold tracking-wider">LOCKED</span>
                          ) : isQuizLesson ? (
                            <>
                              <Award size={10} className="text-amber-500" /> {lesson.duration}
                            </>
                          ) : (
                            <>
                              <PlayCircle size={10} /> {lesson.duration}
                            </>
                          )}
                        </span>
                      </div>

                      {!isLocked && idx < maxUnlockedIndex && (
                        <CheckCircle
                          size={14}
                          className="text-emerald-500 absolute right-3 top-4 opacity-50"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center opacity-50">
                <Lock className={`mx-auto mb-2 ${styles.textMuted}`} />
                <p className={`text-xs ${styles.textMuted}`}>No lessons unlocked.</p>
              </div>
            )}
          </div>
        </aside>

        {/* CONTENT */}
        <main
          id="lesson-content-area"
          className={`flex-1 ${styles.bgMain} flex flex-col overflow-hidden relative w-full transition-colors`}
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isCompleted ? (
              // COMPLETION SCREEN
              <div className="flex flex-col items-center justify-center min-h-full p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/20">
                  <Trophy size={48} className="text-black" />
                </div>

                <h2 className="text-4xl font-bold text-white mb-4">Module Completed!</h2>

                <p className="text-zinc-400 max-w-md mb-8">
                  You have successfully mastered <span className="text-emerald-500">{course.title}</span>.
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setIsCompleted(false);
                      setActiveLessonIndex(0);
                    }}
                    className="px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all font-medium"
                  >
                    Review Material
                  </button>

                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-all"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ) : hasLessons && activeLesson ? (
              <div className="max-w-3xl mx-auto w-full p-8 md:p-16">
                {/* Lesson Header */}
                <div className={`mb-10 text-center border-b ${styles.border} pb-10`}>
                  <div
                    className={`inline-flex items-center gap-2 mb-4 border ${styles.border} px-3 py-1 rounded-full ${
                      isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${hasQuiz ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    ></span>
                    <span className={`text-[10px] font-bold ${styles.textSecondary} uppercase tracking-widest`}>
                      {hasQuiz ? 'Assessment Module' : `Lesson ${activeLesson.lessonNumber}`}
                    </span>
                  </div>

                  <h1 className={`text-3xl md:text-4xl font-bold ${styles.textPrimary} mb-4 leading-tight`}>
                    {activeLesson.title}
                  </h1>

                  <div className={`flex items-center justify-center gap-4 text-xs ${styles.textMuted} font-mono`}>
                    <span className="flex items-center gap-1.5">
                      <PlayCircle size={12} /> {activeLesson.duration} Read
                    </span>
                    <span className={styles.textMuted}>|</span>
                    <span className="flex items-center gap-1.5">
                      <FileText size={12} /> {hasQuiz ? 'Interactive Quiz' : 'Text Module'}
                    </span>
                  </div>
                </div>

                {/* Lesson Content (HTML) */}
                <div className={`course-content p-2 ${styles.textSecondary} leading-relaxed text-lg mb-12`}>
                  <style jsx global>{`
                    .course-content h3 {
                      font-size: 1.5rem;
                      font-weight: 700;
                      color: ${isDarkMode ? '#fff' : '#111827'};
                      margin-top: 0;
                      margin-bottom: 1.5rem;
                      letter-spacing: -0.02em;
                      border-left: 4px solid #10b981;
                      padding-left: 1rem;
                    }
                    .course-content h4 {
                      font-size: 1.1rem;
                      font-weight: 600;
                      color: ${isDarkMode ? '#e4e4e7' : '#374151'};
                      margin-top: 2rem;
                      margin-bottom: 1rem;
                      display: flex;
                      align-items: center;
                      gap: 0.5rem;
                    }
                    .course-content p {
                      margin-bottom: 1.5rem;
                      color: ${isDarkMode ? '#a1a1aa' : '#4b5563'};
                      line-height: 1.75;
                      font-size: 1rem;
                    }
                    .course-content ul,
                    .course-content ol {
                      list-style: none;
                      padding: 0;
                      margin-bottom: 2rem;
                      display: grid;
                      gap: 0.75rem;
                    }
                    .course-content li {
                      position: relative;
                      padding-left: 1.5rem;
                      color: ${isDarkMode ? '#d4d4d8' : '#374151'};
                      line-height: 1.6;
                      font-size: 0.95rem;
                    }
                    .course-content li::before {
                      content: '•';
                      color: #10b981;
                      position: absolute;
                      left: 0;
                      font-weight: bold;
                    }
                    .course-content strong {
                      color: ${isDarkMode ? '#fff' : '#000'};
                      font-weight: 600;
                    }
                    .course-content table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 1.5rem 0;
                      font-size: 0.9rem;
                    }
                    .course-content td,
                    .course-content th {
                      border: 1px solid ${isDarkMode ? '#3f3f46' : '#e5e7eb'};
                      padding: 0.75rem;
                    }
                    .course-content th {
                      background: ${isDarkMode ? '#18181b' : '#f3f4f6'};
                      color: ${isDarkMode ? '#fff' : '#111'};
                      font-weight: 600;
                      text-align: left;
                    }
                    .course-content .tip-box {
                      background: ${isDarkMode ? 'rgba(16, 185, 129, 0.05)' : '#ecfdf5'};
                      border: 1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#a7f3d0'};
                      padding: 1.25rem;
                      margin: 2rem 0;
                      border-radius: 0.75rem;
                      color: ${isDarkMode ? '#d1fae5' : '#065f46'};
                      font-size: 0.95rem;
                    }
                  `}</style>

                  <div dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                </div>

                {/* START QUIZ BUTTON */}
                {hasQuiz && (
                  <div className={`p-8 rounded-xl border ${styles.quizCard} text-center`}>
                    <Award size={48} className="text-amber-500 mx-auto mb-4" />
                    <h3 className={`text-xl font-bold ${styles.textPrimary} mb-2`}>Assessment Ready</h3>
                    <p className="text-zinc-500 mb-6">
                      This assessment contains {activeQuizzes.length} questions. You will have{' '}
                      <span className="text-white font-bold">{activeLesson.time_limit || 10} minutes</span> to complete
                      it. Course notes will be locked.
                    </p>
                    <button
                      onClick={startQuiz}
                      className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-transform hover:scale-105 shadow-lg shadow-amber-900/20"
                    >
                      Start Assessment
                    </button>
                  </div>
                )}

                <div className="h-32"></div>
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center h-full ${styles.textMuted}`}>
                <BookOpen size={48} className="mb-4 opacity-50" />
                <p>Select a lesson to begin.</p>
              </div>
            )}
          </div>

          {/* 3. BOTTOM NAV */}
          {!isCompleted && !isQuizActive && hasLessons && (
            <div
              className={`h-20 ${styles.bgHeader} border-t ${styles.border} flex items-center justify-between px-8 shrink-0 relative z-30`}
            >
              <button
                onClick={handlePrev}
                disabled={activeLessonIndex === 0}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  activeLessonIndex === 0 ? 'opacity-50 cursor-not-allowed' : `hover:text-emerald-500 ${styles.textSecondary}`
                }`}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <span
                className={`text-xs font-mono ${styles.textMuted} px-3 py-1 rounded border ${styles.border} ${
                  isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'
                }`}
              >
                {activeLessonIndex + 1} / {lessons.length}
              </span>

              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 shadow-emerald-900/20"
              >
                {activeLessonIndex === lessons.length - 1 ? 'Finish Module' : 'Next Lesson'} <ChevronRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Debug display (optional): shows which API base you are hitting */}
      <div className="fixed bottom-2 right-2 text-[10px] px-2 py-1 rounded bg-black/50 text-white z-[70]">
        API: {API_URL}
      </div>
    </div>
  );
}
