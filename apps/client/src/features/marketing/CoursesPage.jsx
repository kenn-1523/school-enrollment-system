'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, CheckCircle, Plus, Calendar } from 'lucide-react';

// --- IMPORTS ---
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/footer';
import CourseModal from '../../components/courses/CourseModal';
import CalculatorWidget from '../../components/courses/CalculatorWidget';
import { coursesData } from '@repo/business-logic'; 

// IMPORT THE NEW LOGIC LAYER
// (Ensure you created this file in the previous step!)
import { calculateTuition } from '../../utils/priceCalculator';

import './styles.css';

export default function CoursesPage() {
  // --- STATE ---
  const [calcSelected, setCalcSelected] = useState([]);
  const [isCalcOpen, setIsCalcOpen] = useState(false); // <--- This state controls the widget
  const [selectedCourse, setSelectedCourse] = useState(null); 

  const suits = ['♠', '♥', '♦', '♣'];

  // --- HANDLER: TOGGLE SELECTION ---
  const toggleCalc = (courseCode) => {
    setCalcSelected(prev => {
      const isAdded = prev.includes(courseCode);
      // UX: Auto-open calculator when the first item is added
      if (!isAdded && prev.length === 0) setIsCalcOpen(true);
      return isAdded ? prev.filter(c => c !== courseCode) : [...prev, courseCode];
    });
  };

  // --- BEST PRACTICE: CALCULATE TOTALS USING UTILITY ---
  // Using the safe utility ensures we never get crashes here
  const totals = calculateTuition(calcSelected);

  // --- UI LOGIC: PROGRESS BAR ---
  const getNextDiscountTarget = () => {
    // Safety check for totals.paidCount
    const count = totals?.paidCount || 0;
    if (count < 2) return { next: 2, percent: "10%" };
    if (count < 3) return { next: 3, percent: "15%" };
    if (count < 4) return { next: 4, percent: "20%" };
    if (count < 5) return { next: 5, percent: "25%" };
    return null;
  };
  const nextTarget = getNextDiscountTarget();
  const progressFill = Math.min(((totals?.paidCount || 0) / 5) * 100, 100);

  // --- LOGIC: AUTO-SELECT FREE COURSES ---
  const hasPaidSelected = calcSelected.some(code => {
      const found = coursesData.find(c => c.code === code);
      return found && found.isPaid;
  });

  return (
    <div className="courses-page-wrapper">
      <Navbar />

      <header className="courses-header">
        <h1>Course <span>Curriculum</span></h1>
        <p style={{color: 'rgba(255,255,255,0.8)', maxWidth: '600px', margin: '0 auto'}}>
            Select multiple courses to calculate your bundle discount.
        </p>
      </header>

      {/* --- GRID SECTION --- */}
      <div className="casino-grid-section">
        <div className="casino-grid" id="coursesGrid">
          {coursesData.map((course, index) => {
            const suit = suits[index % suits.length];
            const isSelected = course.isPaid ? calcSelected.includes(course.code) : hasPaidSelected;

            return (
              <article 
                className={`casino-card ${isSelected ? 'calc-active' : ''}`} 
                key={course.code}
                style={{position: 'relative', border: isSelected ? '2px solid #fbbf24' : ''}}
              >
                {/* INTERACTIVE BADGES */}
                {course.isPaid ? (
                    <div 
                        onClick={(e) => { e.stopPropagation(); toggleCalc(course.code); }}
                        style={{
                            position: 'absolute', top: '15px', right: '15px', zIndex: 10,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                            background: isSelected ? '#fbbf24' : 'rgba(0,0,0,0.6)',
                            padding: '8px 12px', borderRadius: '20px',
                            color: isSelected ? 'black' : 'white', fontWeight: 'bold', fontSize: '0.8rem',
                            transition: 'all 0.3s ease',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}
                    >
                        {isSelected ? <CheckCircle size={14}/> : <Plus size={14}/>}
                        {isSelected ? 'Selected' : 'Add'}
                    </div>
                ) : (
                    isSelected && (
                        <div style={{
                            position: 'absolute', top: '15px', right: '15px', zIndex: 10,
                            background: '#22c55e', color: 'white', 
                            padding: '5px 12px', borderRadius: '20px', 
                            fontWeight: 'bold', fontSize: '0.75rem',
                            display: 'flex', alignItems: 'center', gap: '5px'
                        }}>
                           <CheckCircle size={14} /> Included Free
                        </div>
                    )
                )}

                <div className="card-rank-tl"><span>{course.code[0]}</span><span className="suit-icon">{suit}</span></div>
                <div className="card-rank-br"><span>{course.code[0]}</span><span className="suit-icon">{suit}</span></div>
                <div className="card-top"><BookOpen className="card-icon" /></div>
                
                <h2>{course.title}</h2>
                <p>{course.desc}</p>
                <div className="course-price-tag" style={{color: '#fbbf24', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center'}}>
                    {course.displayPrice}
                </div>

                <button onClick={() => setSelectedCourse(course)} className="card-btn">
                    View Details <ArrowRight size={16} />
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* --- WIDGETS --- */}
      <CalculatorWidget 
        isOpen={isCalcOpen}
        setIsOpen={setIsCalcOpen} // <--- FIX IS HERE: Passing the function!
        selectedCourses={totals.selectedObjects.filter(c => c.isPaid)}
        totals={totals} 
        nextTarget={nextTarget}
        progressFill={progressFill}
        onToggle={toggleCalc}
      />

      <CourseModal 
        course={selectedCourse} 
        isOpen={!!selectedCourse} 
        onClose={() => setSelectedCourse(null)}
        onToggleSelect={toggleCalc}
        isSelected={selectedCourse && calcSelected.includes(selectedCourse.code)}
      />

      <Footer />
    </div>
  );
}