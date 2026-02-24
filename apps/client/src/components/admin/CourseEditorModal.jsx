'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    X, Save, Bold, Italic, List, Type, ListOrdered, Undo, 
    Layout, HelpCircle, ChevronRight, Plus, Trash2, Upload, FileSpreadsheet, Download, AlertCircle, Video 
} from 'lucide-react';
import CustomAlert from '../CustomAlert'; 

// ✅ PATCH ONLY: UNIVERSAL API CONFIGURATION (LOCAL + DEPLOY SAFE)
// - Local .env.local: NEXT_PUBLIC_API_URL=http://localhost:3001
// - Prod:            NEXT_PUBLIC_API_URL=https://croupiertraining.sgwebworks.com
// - Prod subpath:    NEXT_PUBLIC_API_URL=https://croupiertraining.sgwebworks.com/backend_api
const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

// --- 0. CUSTOM SCROLLBAR STYLE ---
const scrollbarStyles = `
  .custom-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scroll::-webkit-scrollbar-track {
    background: #0f172a; 
  }
  .custom-scroll::-webkit-scrollbar-thumb {
    background: #334155; 
    border-radius: 3px;
  }
  .custom-scroll::-webkit-scrollbar-thumb:hover {
    background: #475569; 
  }
`;

// --- 1. RICH TEXT EDITOR COMPONENT ---
const RichTextEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);

    const execCmd = (command, value = null) => {
        document.execCommand(command, false, value);
        if (editorRef.current) editorRef.current.focus();
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            if (Math.abs(editorRef.current.innerHTML.length - value.length) > 5) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    return (
        <div className="border border-slate-700 rounded-lg overflow-hidden bg-[#0f172a] flex flex-col h-[400px] shadow-inner">
            <div className="flex items-center gap-1 p-2 bg-slate-800 border-b border-slate-700 overflow-x-auto">
                <ToolbarButton onClick={() => execCmd('formatBlock', 'H3')} icon={<Type size={16} />} title="Heading" />
                <div className="w-px h-4 bg-slate-600 mx-2"></div>
                <ToolbarButton onClick={() => execCmd('bold')} icon={<Bold size={16} />} title="Bold" />
                <ToolbarButton onClick={() => execCmd('italic')} icon={<Italic size={16} />} title="Italic" />
                <div className="w-px h-4 bg-slate-600 mx-2"></div>
                <ToolbarButton onClick={() => execCmd('insertUnorderedList')} icon={<List size={16} />} title="Bullet List" />
                <ToolbarButton onClick={() => execCmd('insertOrderedList')} icon={<ListOrdered size={16} />} title="Numbered List" />
                <div className="w-px h-4 bg-slate-600 mx-2"></div>
                <ToolbarButton onClick={() => execCmd('undo')} icon={<Undo size={16} />} title="Undo" />
            </div>
            <div 
                ref={editorRef}
                className="flex-1 p-6 outline-none text-slate-200 overflow-y-auto prose prose-invert max-w-none custom-scroll"
                contentEditable
                onInput={handleInput}
                style={{ minHeight: '200px' }}
                suppressContentEditableWarning={true}
            />
            <div className="px-4 py-2 bg-slate-800/50 text-[10px] text-slate-500 text-right border-t border-slate-700">
                Visual Editor Active
            </div>
        </div>
    );
};

const ToolbarButton = ({ onClick, icon, title }) => (
    <button 
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }} 
        className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
        title={title}
    >
        {icon}
    </button>
);

// --- 2. MAIN MODAL COMPONENT ---
export default function CourseEditorModal({ courseCode, isOpen, onClose }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [creating, setCreating] = useState(false);
  
  // ✅ ALERT STATE
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'success', 
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Okay',
    cancelText: 'Cancel'
  });

  const fileInputRef = useRef(null);

  const showAlert = (type, title, message, onConfirm = null, confirmText = 'Okay', cancelText = 'Cancel') => {
    setAlert({ isOpen: true, type, title, message, onConfirm, confirmText, cancelText });
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  // --- FETCH DATA ---
  useEffect(() => {
    if (isOpen && courseCode) {
        setLoading(true);
        axios.get(`${API_URL}/admin/courses/${courseCode}/content`, { withCredentials: true })
            .then(res => {
                const loadedLessons = res.data.content || []; 
                setLessons(loadedLessons);
                if (loadedLessons.length > 0) {
                    setActiveLessonId(loadedLessons[0].id);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load content", err);
                setLoading(false);
            });
    }
  }, [isOpen, courseCode]);

  // --- HANDLERS: EDITING ---
  const handleLessonChange = (field, value) => {
    setLessons(prev => prev.map(l => l.id === activeLessonId ? { ...l, [field]: value } : l));
  };

  const handleQuizChange = (quizId, field, value) => {
    setLessons(prev => prev.map(l => {
        if (l.id !== activeLessonId) return l;
        return {
            ...l,
            quizzes: l.quizzes.map(q => q.id === quizId ? { ...q, [field]: value } : q)
        };
    }));
  };

  const handleOptionChange = (quizId, optionIndex, value) => {
      setLessons(prev => prev.map(l => {
        if (l.id !== activeLessonId) return l;
        return {
            ...l,
            quizzes: l.quizzes.map(q => {
                if (q.id !== quizId) return q;
                const newOptions = [...q.options];
                newOptions[optionIndex] = value;
                return { ...q, options: newOptions };
            })
        };
      }));
  };

  // --- HANDLERS: SAVING ---
  const saveLesson = async () => {
      if (!activeLessonId) return;
      const lessonToSave = lessons.find(l => l.id === activeLessonId);
      if (!lessonToSave) return;

      setSavingId(`L-${lessonToSave.id}`);
      
      const payload = {
          title: lessonToSave.title || "Untitled",
          duration: lessonToSave.duration || "10 min",
          content: lessonToSave.content || "",
          video_url: lessonToSave.video_url || null,
          time_limit: lessonToSave.time_limit || 10
      };

      try {
          await axios.put(`${API_URL}/admin/lessons/${lessonToSave.id}`, payload, { withCredentials: true });
          showAlert('success', 'Saved!', 'Lesson details updated successfully.', closeAlert);
      } catch (err) {
          console.error("Save Lesson Error:", err);
          const msg = err.response?.data?.message || err.message;
          showAlert('error', 'Error', `Failed to save lesson: ${msg}`, closeAlert);
      } finally {
          setSavingId(null);
      }
  };

  const saveQuiz = async (quiz) => {
      setSavingId(`Q-${quiz.id}`);
      
      const payload = {
          question: quiz.question,
          options: quiz.options,
          correct_answer: quiz.correct_answer
      };

      try {
          await axios.put(`${API_URL}/admin/quizzes/${quiz.id}`, payload, { withCredentials: true });
          showAlert('success', 'Saved!', 'Quiz question updated.', closeAlert);
      } catch (err) {
          showAlert('error', 'Error', 'Failed to save quiz.', closeAlert);
      } finally {
          setSavingId(null);
      }
  };

  // --- HANDLERS: CREATION ---
  const handleAddLesson = async () => {
      setCreating(true);
      try {
          const payload = {
              title: "New Lesson",
              duration: "10 min",
              content: "<p>Start writing...</p>",
              video_url: null
          };
          
          const res = await axios.post(`${API_URL}/admin/courses/${courseCode}/lessons`, payload, { withCredentials: true });
          
          if (res.data.success) {
              const newLesson = { ...res.data.lesson, quizzes: [] };
              setLessons([...lessons, newLesson]);
              setActiveLessonId(newLesson.id);
          }
      } catch (err) {
          console.error(err);
          showAlert('error', 'Error', 'Failed to create new lesson.', closeAlert);
      } finally {
          setCreating(false);
      }
  };

  const handleDeleteLesson = () => {
      if (!activeLessonId) return;

      showAlert(
          'danger', 
          'Delete Lesson?', 
          'Are you sure you want to delete this lesson? This action cannot be undone.',
          async () => {
              try {
                  await axios.delete(`${API_URL}/admin/lessons/${activeLessonId}`, { withCredentials: true });
                  const updatedLessons = lessons.filter(l => l.id !== activeLessonId);
                  setLessons(updatedLessons);
                  if (updatedLessons.length > 0) {
                      setActiveLessonId(updatedLessons[0].id);
                  } else {
                      setActiveLessonId(null);
                  }
                  closeAlert();
              } catch (err) {
                  console.error("Delete Lesson Error:", err);
                  showAlert('error', 'Error', 'Failed to delete lesson.', closeAlert);
              }
          },
          'Yes, Delete',
          'Cancel'
      );
  };

  const handleAddQuiz = async () => {
      if (!activeLessonId) return;
      setCreating(true);
      try {
          const payload = {
              question: "New Question?",
              options: ["Option A", "Option B", "Option C", "Option D"],
              correct_answer: "Option A"
          };

          const res = await axios.post(`${API_URL}/admin/lessons/${activeLessonId}/quizzes`, payload, { withCredentials: true });
          
          if (res.data.success) {
              const newQuiz = res.data.quiz;
              if (typeof newQuiz.options === 'string') {
                  newQuiz.options = JSON.parse(newQuiz.options);
              }

              setLessons(prev => prev.map(l => {
                  if (l.id !== activeLessonId) return l;
                  return { ...l, quizzes: [...(l.quizzes || []), newQuiz] };
              }));
          }
      } catch (err) {
          console.error("Add Quiz Error:", err);
          showAlert('error', 'Error', 'Failed to add quiz.', closeAlert);
      } finally {
          setCreating(false);
      }
  };

  const handleDeleteQuiz = (quizId) => {
      showAlert(
          'danger', 
          'Delete Question?', 
          'Are you sure you want to delete this quiz question?',
          async () => {
              try {
                  await axios.delete(`${API_URL}/admin/quizzes/${quizId}`, { withCredentials: true });
                  setLessons(prev => prev.map(l => {
                      if (l.id !== activeLessonId) return l;
                      return { ...l, quizzes: l.quizzes.filter(q => q.id !== quizId) };
                  }));
                  closeAlert();
              } catch (err) {
                  showAlert('error', 'Error', 'Failed to delete quiz.', closeAlert);
              }
          },
          'Delete',
          'Cancel'
      );
  };

  const handleDownloadTemplate = () => {
      const csvContent = "data:text/csv;charset=utf-8," 
          + "Question,Option A,Option B,Option C,Option D,Correct Answer\n"
          + "What is 2+2?,1,2,3,4,4\n"
          + "Capital of France?,London,Berlin,Paris,Madrid,Paris";
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "quiz_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.name.endsWith('.csv')) {
          showAlert('info', 'Invalid File', 'Please upload a .csv file.', closeAlert);
          return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const text = e.target.result;
              const rows = text.split('\n').filter(row => row.trim() !== '');
              const dataRows = rows.slice(1); 
              
              const quizzes = dataRows.map(row => {
                  const cols = row.split(',').map(c => c.trim());
                  if (cols.length < 6) return null;
                  return {
                      question: cols[0],
                      options: [cols[1], cols[2], cols[3], cols[4]],
                      correct_answer: cols[5]
                  };
              }).filter(q => q !== null);

              if (quizzes.length === 0) throw new Error("No valid quizzes found in CSV.");

              const res = await axios.post(`${API_URL}/admin/lessons/${activeLessonId}/quizzes/bulk`, { quizzes }, { withCredentials: true });
              
              if (res.data.success) {
                  showAlert('success', 'Import Successful', res.data.message, closeAlert);
                  const refresh = await axios.get(`${API_URL}/admin/courses/${courseCode}/content`, { withCredentials: true });
                  setLessons(refresh.data.content || []); 
              }
          } catch (err) {
              console.error(err);
              showAlert('error', 'Import Failed', err.message || "Unknown error", closeAlert);
          }
      };
      reader.readAsText(file);
      event.target.value = ''; 
  };

  const activeLesson = lessons.find(l => l.id === activeLessonId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <style>{scrollbarStyles}</style>

      <CustomAlert 
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
        onClose={closeAlert}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
      />

      <div className="bg-[#1e293b] w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl border border-slate-700 flex overflow-hidden animate-fade-in">
        
        {/* --- LEFT SIDEBAR: LESSON LIST --- */}
        <div className="w-80 bg-[#0f172a] border-r border-slate-700 flex flex-col">
            <div className="p-6 border-b border-slate-700">
                <h2 className="text-white font-bold text-lg tracking-wide">Edit Content</h2>
                <span className="text-xs text-blue-400 font-mono mt-1 block uppercase">Course: {courseCode}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll">
                {loading ? <div className="text-slate-500 text-center text-sm py-4">Loading lessons...</div> : 
                 lessons.map((lesson, idx) => (
                    <button 
                        key={lesson.id} 
                        onClick={() => setActiveLessonId(lesson.id)}
                        className={`w-full text-left p-4 rounded-xl text-sm transition-all border group relative ${
                            activeLessonId === lesson.id 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                            : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs uppercase tracking-wider opacity-80">Lesson {lesson.lesson_order || idx + 1}</span>
                            {activeLessonId === lesson.id && <ChevronRight size={14}/>}
                        </div>
                        <div className="font-semibold truncate pr-4">{lesson.title}</div>
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-slate-700 bg-[#0f172a]">
                <button 
                    onClick={handleAddLesson}
                    disabled={creating || loading}
                    className="w-full py-3 rounded-lg border-2 border-dashed border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/10 transition-all font-bold text-sm flex items-center justify-center gap-2"
                >
                    <Plus size={18}/> {creating ? "Creating..." : "Add New Lesson"}
                </button>
            </div>
        </div>

        {/* --- RIGHT CONTENT: EDITOR --- */}
        <div className="flex-1 flex flex-col bg-[#1e293b]">
            <div className="h-20 border-b border-slate-700 flex items-center justify-between px-8 bg-[#1e293b]">
                <div>
                    <h3 className="text-slate-200 font-bold flex items-center gap-2 text-lg">
                        <Layout size={20} className="text-blue-500"/> 
                        {activeLesson ? activeLesson.title : 'Select a Lesson'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Make changes below and click save.</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scroll">
                {activeLesson ? (
                    <div className="max-w-4xl mx-auto space-y-8 pb-10">
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Lesson Title</label>
                                <input 
                                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                                    value={activeLesson.title}
                                    onChange={(e) => handleLessonChange('title', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Duration</label>
                                <input 
                                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                                    value={activeLesson.duration}
                                    onChange={(e) => handleLessonChange('duration', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                <Video size={14}/> Video URL
                            </label>
                            <input 
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                                placeholder="https://youtube.com/..."
                                value={activeLesson.video_url || ''}
                                onChange={(e) => handleLessonChange('video_url', e.target.value)}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Lesson Content</label>
                                <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20">Rich Text Mode</span>
                            </div>
                            
                            <RichTextEditor 
                                value={activeLesson.content || ''} 
                                onChange={(newContent) => handleLessonChange('content', newContent)}
                            />
                        </div>

                        <div className="border-t border-slate-700 pt-8">
                            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                    <HelpCircle size={18} className="text-emerald-500"/> Associated Quizzes
                                </h3>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleDownloadTemplate}
                                        className="px-3 py-1.5 rounded bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 text-xs font-bold flex items-center gap-2 transition-all"
                                    >
                                        <Download size={14}/> Template
                                    </button>

                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileUpload} 
                                        accept=".csv" 
                                        style={{ display: 'none' }} 
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current.click()}
                                        className="px-3 py-1.5 rounded bg-blue-600/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white text-xs font-bold flex items-center gap-2 transition-all"
                                    >
                                        <FileSpreadsheet size={14}/> Import CSV
                                    </button>

                                    <button 
                                        onClick={handleAddQuiz}
                                        disabled={creating}
                                        className="px-3 py-1.5 rounded bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white text-xs font-bold flex items-center gap-2 transition-all"
                                    >
                                        <Plus size={14}/> Add Question
                                    </button>
                                </div>
                            </div>
                            
                            {(!activeLesson.quizzes || activeLesson.quizzes.length === 0) ? (
                                <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-6 text-center">
                                    <p className="text-sm text-slate-500 italic">No quizzes attached to this lesson.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {activeLesson.quizzes.map((quiz, qIdx) => (
                                        <div key={quiz.id} className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors relative group">
                                            
                                            <button 
                                                onClick={() => handleDeleteQuiz(quiz.id)}
                                                className="absolute top-4 right-4 p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16}/>
                                            </button>

                                            <div className="grid gap-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Question {qIdx + 1}</label>
                                                    <input 
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors"
                                                        value={quiz.question}
                                                        onChange={(e) => handleQuizChange(quiz.id, 'question', e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {quiz.options.map((opt, oIdx) => (
                                                        <div key={oIdx}>
                                                            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Option {oIdx + 1}</label>
                                                            <input 
                                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none transition-colors"
                                                                value={opt}
                                                                onChange={(e) => handleOptionChange(quiz.id, oIdx, e.target.value)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-2 gap-6 items-end">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Correct Answer</label>
                                                        <select 
                                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors appearance-none cursor-pointer"
                                                            value={quiz.correct_answer}
                                                            onChange={(e) => handleQuizChange(quiz.id, 'correct_answer', e.target.value)}
                                                        >
                                                            {quiz.options.map((opt, i) => (
                                                                <option key={i} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <button 
                                                            onClick={() => saveQuiz(quiz)}
                                                            disabled={savingId === `Q-${quiz.id}`}
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
                                                        >
                                                            <Save size={14} /> {savingId === `Q-${quiz.id}` ? 'Saving...' : 'Save Quiz'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Layout size={48} className="mb-4 opacity-20 text-blue-500"/>
                        <p>Select a lesson from the sidebar to start editing.</p>
                    </div>
                )}
            </div>

            {activeLesson && (
                <div className="p-6 border-t border-slate-700 bg-[#0f172a] flex justify-between items-center">
                    <button 
                        onClick={handleDeleteLesson}
                        className="px-4 py-2.5 rounded-lg border border-red-900/30 text-red-500 hover:bg-red-900/20 font-bold text-sm transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={18} />
                        <span className="hidden sm:inline">Delete Lesson</span>
                    </button>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 font-bold text-sm transition-colors">
                            Close
                        </button>
                        <button 
                            onClick={saveLesson}
                            disabled={savingId === `L-${activeLesson.id}`}
                            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {savingId === `L-${activeLesson.id}` ? 'Saving...' : 'Save Lesson'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
