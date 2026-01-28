'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Menu, X, BookOpen, ArrowRight, CheckCircle, XCircle, 
  Clock, Sun, Moon, Facebook, Linkedin, Instagram, 
  Calculator, Plus, Calendar, ChevronDown, Trash2
} from 'lucide-react';

import { useTheme } from '../../context/ThemeContext'; 

// Import the CSS for the Calculator Widget
import './styles.css';

export default function CoursesPage() {
  // --- STATE MANAGEMENT ---
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // --- CALCULATOR STATE ---
  const [calcSelected, setCalcSelected] = useState([]);
  const [isCalcOpen, setIsCalcOpen] = useState(false); 

  const { isDarkMode, toggleTheme } = useTheme();

  // --- DATA ---
  const courses = [
    { 
      code: "F1", 
      title: "Introduction to Casino Gaming", 
      desc: "The essential foundation. Learn history, etiquette, and chip handling.", 
      displayPrice: "Free with Bundle", 
      price: 0, 
      duration: "2 Months",
      isPaid: false, // FREE
      objectives: ["Understand hierarchy", "Chip handling basics", "Casino Terminology"] 
    },
    { 
      code: "G1", 
      title: "Black Jack", 
      desc: "Master the world's most popular game. Rules, math, and protection.", 
      displayPrice: "$300 USD", 
      price: 300,
      duration: "2 Months",
      isPaid: true, // PAID
      objectives: ["Shoe delivery", "3:2 and 6:5 payouts", "Game protection"] 
    },
    { 
      code: "G2", 
      title: "Poker", 
      desc: "Expert instruction on Texas Hold'em. Shuffling, rake, and pots.", 
      displayPrice: "$300 USD", 
      price: 300,
      duration: "2 Months",
      isPaid: true, // PAID
      objectives: ["Riffle shuffle", "Rake collection", "Side pots"] 
    },
    { 
      code: "G3", 
      title: "Baccarat", 
      desc: "Learn the elegance of Baccarat. Third-card rules and commissions.", 
      displayPrice: "$300 USD", 
      price: 300,
      duration: "2 Months",
      isPaid: true, // PAID
      objectives: ["Third Card Rules", "Commission calculation", "Squeezing techniques"] 
    },
    { 
      code: "G4", 
      title: "Roulette", 
      desc: "The Queen of casino games. Chip mucking and wheel spinning.", 
      displayPrice: "$400 USD", 
      price: 400,
      duration: "2 Months",
      isPaid: true, // PAID
      objectives: ["Mucking chips", "Picture bets", "Neighbor bets"] 
    },
    { 
      code: "G5", 
      title: "Craps", 
      desc: "The most exciting game. Stick calls, dice handling, and payouts.", 
      displayPrice: "$500 USD", 
      price: 500,
      duration: "2 Months",
      isPaid: true, // PAID
      objectives: ["Stick handling", "Proposition bets", "Boxman duties"] 
    },
    { 
      code: "C1", 
      title: "Communication Skills", 
      desc: "Verbal and non-verbal techniques for command and control.", 
      displayPrice: "Free with Bundle", 
      price: 0,
      duration: "2 Months",
      isPaid: false, // FREE
      objectives: ["Vocal projection", "Body language", "De-escalation"] 
    },
    { 
      code: "C2", 
      title: "Etiquette & Guest Relations", 
      desc: "Refine your professional demeanor and VIP protocol.", 
      displayPrice: "Free with Bundle", 
      price: 0,
      duration: "2 Months",
      isPaid: false, // FREE
      objectives: ["VIP protocol", "Grooming", "Tipping etiquette"] 
    }
  ];

  const suits = ['♠', '♥', '♦', '♣'];

  // --- EFFECTS ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) setScrolled(true);
      else setScrolled(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- CALCULATOR LOGIC ---
  const toggleCalc = (courseCode) => {
    setCalcSelected(prev => {
      const isAdded = prev.includes(courseCode);
      
      // Auto-open logic when first item is added
      if (!isAdded && prev.length === 0) {
        setIsCalcOpen(true);
      }
      
      if (isAdded) {
        return prev.filter(c => c !== courseCode);
      } else {
        return [...prev, courseCode];
      }
    });
  };

  const calculateTotals = () => {
    const selectedObjects = courses.filter(c => calcSelected.includes(c.code));
    const paidCount = selectedObjects.filter(c => c.isPaid).length;
    const subtotal = selectedObjects.reduce((sum, c) => sum + c.price, 0);

    let discountPercent = 0;
    if (paidCount === 2) discountPercent = 0.10;
    else if (paidCount === 3) discountPercent = 0.15;
    else if (paidCount === 4) discountPercent = 0.20;
    else if (paidCount >= 5) discountPercent = 0.25;

    const discountAmount = subtotal * discountPercent;
    const finalTotal = subtotal - discountAmount;

    return { selectedObjects, subtotal, discountPercent, discountAmount, finalTotal, paidCount };
  };

  const totals = calculateTotals();

  // Helper for Discount Text
  const getNextDiscountTarget = () => {
    if (totals.paidCount < 2) return { next: 2, percent: "10%" };
    if (totals.paidCount < 3) return { next: 3, percent: "15%" };
    if (totals.paidCount < 4) return { next: 4, percent: "20%" };
    if (totals.paidCount < 5) return { next: 5, percent: "25%" };
    return null;
  };

  const nextTarget = getNextDiscountTarget();
  const progressFill = Math.min((totals.paidCount / 5) * 100, 100);

  // --- LOGIC: CHECK IF ANY PAID COURSE IS SELECTED ---
  const hasPaidSelected = calcSelected.some(code => {
      const found = courses.find(c => c.code === code);
      return found && found.isPaid;
  });

  // --- HANDLERS ---
  const openModal = (course) => {
    setSelectedCourse(course);
    document.body.style.overflow = 'hidden'; 
  };

  const closeModal = () => {
    setSelectedCourse(null);
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="courses-page-wrapper">
      
      {/* --- NAVBAR --- */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="logo-container">
          <Link href="/" className="logo-link">
            <img 
              src="/images/clean-ects.png" 
              alt="Logo" 
              className="logo-image" 
              onError={(e) => e.target.style.display='none'}
            />
            <div className="logo-text-wrapper">
              <span className="brand-title">Elite Croupier</span>
              <span className="brand-subtitle">Training Services</span>
            </div>
          </Link>
        </div>

        <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/courses" className="active" onClick={() => setMobileMenuOpen(false)}>Courses</Link>
          <Link href="/enroll" className="mobile-enroll-btn" onClick={() => setMobileMenuOpen(false)}>Enroll Now</Link>
        </div>

        <div className="nav-actions-container">
          <button onClick={toggleTheme} className="theme-toggle-btn">
             {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <div className="desktop-only-action">
            <Link href="/enroll"><button className="btn-primary-nav">Enroll Now</button></Link>
          </div>
          <div className="mobile-only-control">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- HEADER --- */}
      <header className="courses-header">
        <h1>Course <span>Curriculum</span></h1>
        <p style={{color: 'rgba(255,255,255,0.8)', maxWidth: '600px', margin: '0 auto'}}>
            Our curriculum is designed to take you from beginner to professional dealer.
            Select multiple courses to calculate your bundle discount.
        </p>
      </header>

      {/* --- COURSE GRID --- */}
      <div className="casino-grid-section">
        <div className="casino-grid" id="coursesGrid">
          {courses.map((course, index) => {
            const suit = suits[index % suits.length];
            
            // LOGIC FIX: 
            // 1. If it's a PAID course, check if user clicked it.
            // 2. If it's a FREE course, check if ANY paid course is selected (Auto-Select).
            const isSelected = course.isPaid 
                ? calcSelected.includes(course.code)
                : hasPaidSelected;

            return (
              <article 
                className={`casino-card ${isSelected ? 'calc-active' : ''}`} 
                key={index}
                style={{position: 'relative', border: isSelected ? '2px solid #fbbf24' : ''}}
              >
                
                {/* CHECKBOX / BADGE */}
                {course.isPaid ? (
                    // PAID: Interactive Add Button
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
                    // FREE: Auto-Selected Badge (No Click)
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

                <div className="card-rank-tl"><span>{course.code}</span><span className="suit-icon">{suit}</span></div>
                <div className="card-rank-br"><span>{course.code}</span><span className="suit-icon">{suit}</span></div>

                <div className="card-top"><BookOpen className="card-icon" /></div>
                <h2>{course.title}</h2>
                <p>{course.desc}</p>
                
                {/* DURATION */}
                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', color:'#94a3b8', fontSize:'0.9rem', marginBottom:'10px'}}>
                   <Calendar size={14} /> Duration: {course.duration}
                </div>

                <div className="course-price-tag" style={{color: '#fbbf24', fontWeight: 'bold', marginBottom: '1rem'}}>
                    {course.displayPrice}
                </div>

                <button onClick={() => openModal(course)} className="card-btn">
                    View Details <ArrowRight size={16} />
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* --- FLOATING CALCULATOR WIDGET --- */}
      <div className="calc-widget-container">
        
        {/* Toggle Button */}
        <button className="calc-toggle-btn" onClick={() => setIsCalcOpen(!isCalcOpen)}>
            {isCalcOpen ? <X size={28} color="#0f172a"/> : <Calculator size={28} color="#0f172a"/>}
            {totals.paidCount > 0 && !isCalcOpen && (
                <span className="calc-badge">{totals.paidCount}</span>
            )}
        </button>

        {/* Widget Body */}
        {isCalcOpen && (
            <div className="calc-body">
                
                <div className="calc-header-section">
                    <h4><Calculator size={18}/> Tuition Estimator</h4>
                    <button className="close-widget" onClick={() => setIsCalcOpen(false)}>
                        <ChevronDown size={20}/>
                    </button>
                </div>

                {/* List: ONLY Paid courses interactive here */}
                <div className="calc-items-list">
                    {courses.filter(c => c.isPaid).map(course => {
                        const isChecked = calcSelected.includes(course.code);
                        return (
                            <div key={course.code} className="calc-item-row" 
                                 onClick={() => toggleCalc(course.code)}
                                 style={{cursor: 'pointer', padding: '0.8rem 0', alignItems:'center', display:'flex', gap:'10px'}}>
                                
                                <div style={{
                                    width:'20px', height:'20px', 
                                    border: isChecked ? '2px solid #fbbf24' : '2px solid #64748b',
                                    background: isChecked ? '#fbbf24' : 'transparent',
                                    borderRadius: '4px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s'
                                }}>
                                    {isChecked && <CheckCircle size={14} color="black"/>}
                                </div>

                                <span style={{flex: 1, color: isChecked ? '#fbbf24' : '#e2e8f0'}}>
                                    {course.title}
                                </span>
                                <span style={{color: isChecked ? '#fbbf24' : '#64748b'}}>
                                    ${course.price}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Math & Totals */}
                <div className="calc-math-section">
                    {nextTarget ? (
                        <>
                            <div className="discount-text">
                                Pick <strong>{nextTarget.next - totals.paidCount} more</strong> for {nextTarget.percent} OFF!
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
                        <span>${totals.subtotal.toLocaleString()}</span>
                    </div>
                    
                    {totals.discountPercent > 0 && (
                        <div className="math-row discount">
                            <span>Discount ({(totals.discountPercent * 100).toFixed(0)}%)</span>
                            <span>-${totals.discountAmount.toLocaleString()}</span>
                        </div>
                    )}

                    <div className="math-row total">
                        <span>TOTAL</span>
                        <span>${totals.finalTotal.toLocaleString()}</span>
                    </div>

                    <Link href="/enroll">
                        <button className="calc-checkout-btn">Proceed to Enroll</button>
                    </Link>
                </div>
            </div>
        )}
      </div>

      {/* --- MODAL --- */}
      {selectedCourse && (
        <div className="modal-overlay" style={{opacity: 1, visibility: 'visible'}} onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <span className="modal-course-badge">{selectedCourse.code} | COURSE DETAIL</span>
                <button className="modal-close-btn" onClick={closeModal}><XCircle size={24} /></button>
            </div>
            
            <div className="modal-body">
                <h3 className="modal-title" style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>
                    {selectedCourse.title}
                </h3>
                <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#fbbf24', fontSize:'0.9rem', marginBottom:'1rem'}}>
                   <Calendar size={16} /> Duration: {selectedCourse.duration}
                </div>
                <p className="modal-desc" style={{color: '#94a3b8'}}>{selectedCourse.desc}</p>
                <div className="modal-section-title" style={{marginTop:'1rem', display:'flex', alignItems:'center', color:'#fbbf24', fontWeight:'bold'}}>
                    <Clock size={16} style={{marginRight: '5px'}} /> Training Objectives
                </div>
                <ul className="modal-list" style={{marginTop:'0.5rem', paddingLeft:'1rem', listStyle:'disc', color:'#cbd5e1'}}>
                    {selectedCourse.objectives.map((obj, i) => (<li key={i}>{obj}</li>))}
                </ul>
            </div>
            
            <div className="modal-footer">
                <div>
                    <span className="modal-price-label" style={{display:'block', fontSize:'0.8rem', color:'#94a3b8'}}>Tuition Fee</span>
                    <span className="modal-price-value" style={{fontSize:'1.5rem', fontWeight:'bold', color:'white'}}>{selectedCourse.displayPrice}</span>
                </div>
                {selectedCourse.isPaid ? (
                    <button className="btn-gold-sm" onClick={() => toggleCalc(selectedCourse.code)}>
                        {calcSelected.includes(selectedCourse.code) ? 'Remove' : 'Select'}
                    </button>
                ) : (
                    <Link href="/enroll"><button className="btn-gold-sm">Enroll Now</button></Link>
                )}
            </div>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div className="footer-content">
            <div className="footer-brand">
                <h3>Elite Croupier Academy</h3>
                <p>Infotech division of Segovia Group</p>
                <address className="footer-address">Makati City, Philippines</address>
            </div>
            <div className="footer-legal">
                <div className="social-icons">
                    <a href="#" className="social-icon-link"><Facebook size={20} /></a>
                    <a href="#" className="social-icon-link"><Linkedin size={20} /></a>
                    <a href="#" className="social-icon-link"><Instagram size={20} /></a>
                </div>
            </div>
        </div>
        <div className="copyright-row">
            <span>© 2026 SGWebworks. All rights reserved.</span>
            <div className="legal-links">
                <Link href="#">Privacy Policy</Link>
                <span className="separator">|</span>
                <Link href="#">Terms of Service</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}