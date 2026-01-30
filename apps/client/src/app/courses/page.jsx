'use client';

import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/footer'; // Ensure this matches your filename (footer.jsx)
import CourseModal from '../../components/courses/CourseModal';
import CalculatorWidget from '../../components/courses/CalculatorWidget';
import CourseCard from '../../components/courses/CourseCard'; 
import { coursesData } from '@repo/business-logic'; 

// ✅ Logic Layer Import
import { calculateTuition } from '../../utils/priceCalculator';

// ✅ Global CSS Import (From the previous step)
import '../../styles/marketing.css'; 

export default function CoursesPage() {
  // --- STATE ---
  const [calcSelected, setCalcSelected] = useState([]);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null); 

  // --- ACTIONS ---
  const toggleCalc = (courseCode) => {
    setCalcSelected(prev => {
      const isAdded = prev.includes(courseCode);
      // UX: Auto-open calculator when the first item is added
      if (!isAdded && prev.length === 0) setIsCalcOpen(true); 
      return isAdded ? prev.filter(c => c !== courseCode) : [...prev, courseCode];
    });
  };

  // --- DATA (Logic Delegated to Service Layer) ---
  const totals = calculateTuition(calcSelected);

  // --- UI LOGIC: PROGRESS BAR ---
  const getNextDiscountTarget = () => {
    const count = totals?.paidCount || 0;
    if (count < 2) return { next: 2, percent: "10%" };
    if (count < 3) return { next: 3, percent: "15%" };
    if (count < 4) return { next: 4, percent: "20%" };
    if (count < 5) return { next: 5, percent: "25%" };
    return null;
  };
  const nextTarget = getNextDiscountTarget();
  const progressFill = Math.min(((totals?.paidCount || 0) / 5) * 100, 100);

  return (
    <div className="courses-page-wrapper">
      <Navbar />

      <header className="courses-header">
        <h1>Course <span>Curriculum</span></h1>
        <p style={{color: 'rgba(255,255,255,0.8)', maxWidth: '600px', margin: '0 auto'}}>
            Select multiple courses to calculate your bundle discount.
        </p>
      </header>

      {/* --- GRID SECTION (Clean & Component-Based) --- */}
      <div className="casino-grid-section">
        <div className="casino-grid" id="coursesGrid">
          {coursesData.map((course, index) => (
            <CourseCard 
                key={course.code || index}
                course={course}
                isSelected={calcSelected.includes(course.code)}
                isFreeIncluded={totals.isFreeIncluded}
                onSelect={toggleCalc}
                onViewDetails={setSelectedCourse}
            />
          ))}
        </div>
      </div>

      {/* --- WIDGETS --- */}
      <CalculatorWidget 
        isOpen={isCalcOpen}
        setIsOpen={setIsCalcOpen} 
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