"use client";
import React from 'react';
import Link from 'next/link';
import { X, Calculator, ChevronDown, CheckCircle } from 'lucide-react';
import { coursesData } from '@repo/business-logic'; // Import Data to show full list

export default function CalculatorWidget({ 
  isOpen, 
  setIsOpen, 
  selectedCourses = [], 
  // Default values to prevent crashes
  totals = { paidCount: 0, subtotal: 0, finalTotal: 0, discountPercent: 0, discountAmount: 0 }, 
  nextTarget, 
  progressFill = 0, 
  onToggle 
}) {
  
  // Filter to show only Paid courses in the list (Free course is auto-included)
  const allPaidCourses = coursesData.filter(c => c.isPaid);

  return (
    <div className="calc-widget-container">
        {/* Toggle Button */}
        <button className="calc-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} color="#0f172a"/> : <Calculator size={28} color="#0f172a"/>}
            {totals && totals.paidCount > 0 && !isOpen && (
                <span className="calc-badge">{totals.paidCount}</span>
            )}
        </button>

        {/* Widget Body */}
        {isOpen && (
            <div className="calc-body">
                <div className="calc-header-section">
                    <h4><Calculator size={18}/> Tuition Estimator</h4>
                    <button className="close-widget" onClick={() => setIsOpen(false)}>
                        <ChevronDown size={20}/>
                    </button>
                </div>

                {/* --- NEW: SELECTION CHECKLIST --- */}
                <div className="calc-items-list">
                    {allPaidCourses.map(course => {
                         // Check if this specific course is currently active
                         const isSelected = selectedCourses.some(c => c.code === course.code);

                         return (
                             <div key={course.code} className="calc-item-row" 
                                  onClick={() => onToggle(course.code)}
                                  style={{
                                      cursor: 'pointer', 
                                      padding: '0.8rem 0', 
                                      alignItems:'center', 
                                      display:'flex', 
                                      gap:'10px',
                                      // Dim the item if it's not selected
                                      opacity: isSelected ? 1 : 0.5,
                                      transition: 'all 0.2s ease'
                                  }}>
                                 
                                 {/* Custom Checkbox UI */}
                                 <div style={{
                                     width:'20px', height:'20px', 
                                     border: isSelected ? '2px solid #fbbf24' : '2px solid #64748b',
                                     background: isSelected ? '#fbbf24' : 'transparent',
                                     borderRadius: '4px', 
                                     display:'flex', alignItems:'center', justifyContent:'center'
                                 }}>
                                     {isSelected && <CheckCircle size={14} color="#0f172a"/>}
                                 </div>

                                 <span style={{
                                     flex: 1, 
                                     color: isSelected ? '#fbbf24' : '#94a3b8',
                                     fontWeight: isSelected ? 'bold' : 'normal'
                                 }}>
                                     {course.title}
                                 </span>
                                 <span style={{color: isSelected ? '#fbbf24' : '#64748b'}}>
                                     ${course.price}
                                 </span>
                             </div>
                         );
                    })}
                </div>

                {/* Math & Totals Section */}
                <div className="calc-math-section">
                    {nextTarget ? (
                        <>
                            <div className="discount-text">
                                Pick <strong>{nextTarget.next - (totals.paidCount || 0)} more</strong> for {nextTarget.percent} OFF!
                            </div>
                            <div className="discount-progress">
                                <div className="discount-fill" style={{width: `${progressFill}%`}}></div>
                            </div>
                        </>
                    ) : (
                        <div className="discount-text" style={{color:'#22c55e', fontWeight:'bold'}}>
                            🎉 Maximum 25% Discount Active!
                        </div>
                    )}

                    <div className="math-row">
                        <span>Subtotal</span>
                        <span>${(totals.subtotal || 0).toLocaleString()}</span>
                    </div>
                    
                    {totals.discountPercent > 0 && (
                        <div className="math-row discount">
                            <span>Discount ({(totals.discountPercent * 100).toFixed(0)}%)</span>
                            <span>-${(totals.discountAmount || 0).toLocaleString()}</span>
                        </div>
                    )}

                    <div className="math-row total">
                        <span>TOTAL</span>
                        <span>${(totals.finalTotal || 0).toLocaleString()}</span>
                    </div>

                    <Link href="/enroll">
                        <button className="calc-checkout-btn">Proceed to Enroll</button>
                    </Link>
                </div>
            </div>
        )}
      </div>
  );
}