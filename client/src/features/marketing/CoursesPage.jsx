'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Menu, X, BookOpen, ArrowRight, CheckCircle, XCircle, 
  Clock, Sun, Moon, Facebook, Linkedin, Instagram
} from 'lucide-react';

import { useTheme } from '../../context/ThemeContext'; 

export default function CoursesPage() {
  // --- STATE ---
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { isDarkMode, toggleTheme } = useTheme();


  // --- DATA FROM YOUR HTML SCRIPT ---
  const courses = [
    { 
      code: "F1", 
      title: "Introduction to Casino Gaming", 
      desc: "The essential foundation. Learn history, etiquette, and chip handling.", 
      price: "$250 USD", 
      objectives: ["Understand hierarchy", "Chip handling basics", "Casino Terminology"] 
    },
    { 
      code: "G1", 
      title: "Black Jack", 
      desc: "Master the world's most popular game. Rules, math, and protection.", 
      price: "$400 USD", 
      objectives: ["Shoe delivery", "3:2 and 6:5 payouts", "Game protection"] 
    },
    { 
      code: "G2", 
      title: "Poker", 
      desc: "Expert instruction on Texas Hold'em. Shuffling, rake, and pots.", 
      price: "$450 USD", 
      objectives: ["Riffle shuffle", "Rake collection", "Side pots"] 
    },
    { 
      code: "G3", 
      title: "Baccarat", 
      desc: "Learn the elegance of Baccarat. Third-card rules and commissions.", 
      price: "$350 USD", 
      objectives: ["Third Card Rules", "Commission calculation", "Squeezing techniques"] 
    },
    { 
      code: "G4", 
      title: "Roulette", 
      desc: "The Queen of casino games. Chip mucking and wheel spinning.", 
      price: "$500 USD", 
      objectives: ["Mucking chips", "Picture bets", "Neighbor bets"] 
    },
    { 
      code: "G5", 
      title: "Craps", 
      desc: "The most exciting game. Stick calls, dice handling, and payouts.", 
      price: "$500 USD", 
      objectives: ["Stick handling", "Proposition bets", "Boxman duties"] 
    },
    { 
      code: "C1", 
      title: "Communication Skills", 
      desc: "Verbal and non-verbal techniques for command and control.", 
      price: "$200 USD", 
      objectives: ["Vocal projection", "Body language", "De-escalation"] 
    },
    { 
      code: "C2", 
      title: "Etiquette & Guest Relations", 
      desc: "Refine your professional demeanor and VIP protocol.", 
      price: "$200 USD", 
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

  // --- HANDLERS ---
  const openModal = (course) => {
    setSelectedCourse(course);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
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

{/* Inside CoursesPage.jsx - Navbar Section */}
        <div className="nav-actions-container">
          
          {/* 3. ADDED: Clean Theme Toggle */}
          <button 
              onClick={toggleTheme} 
              className="theme-toggle-btn" 
              aria-label="Toggle Theme"
          >
             {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>

          <div className="desktop-only-action">
            <Link href="/enroll">
              <button className="btn-primary-nav">Enroll Now</button>
            </Link>
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
        </p>
      </header>

      {/* --- COURSE GRID (PLAYING CARDS) --- */}
      <div className="casino-grid-section">
        <div className="casino-grid" id="coursesGrid">
          {courses.map((course, index) => {
            // Cycle through suits based on index
            const suit = suits[index % suits.length];
            
            return (
              <article className="casino-card" key={index}>
                {/* Top Left Corner */}
                <div className="card-rank-tl">
                    <span>{course.code}</span>
                    <span className="suit-icon">{suit}</span>
                </div>

                {/* Bottom Right Corner */}
                <div className="card-rank-br">
                    <span>{course.code}</span>
                    <span className="suit-icon">{suit}</span>
                </div>

                {/* Card Body */}
                <div className="card-top">
                    <BookOpen className="card-icon" />
                </div>
                <h2>{course.title}</h2>
                <p>{course.desc}</p>
                
                <button onClick={() => openModal(course)} className="card-btn">
                    View Details 
                    <ArrowRight size={16} />
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* --- MODAL --- */}
      {selectedCourse && (
        <div className="modal-overlay" style={{opacity: 1, visibility: 'visible'}} onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <span className="modal-course-badge">{selectedCourse.code} | COURSE DETAIL</span>
                <button className="modal-close-btn" onClick={closeModal}>
                    <XCircle size={24} />
                </button>
            </div>
            
            <div className="modal-body">
                <h3 className="modal-title" style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>
                    {selectedCourse.title}
                </h3>
                <p className="modal-desc" style={{color: '#94a3b8'}}>
                    {selectedCourse.desc}
                </p>
                
                <div className="modal-section-title" style={{marginTop:'1rem', display:'flex', alignItems:'center', color:'#fbbf24', fontWeight:'bold'}}>
                    <Clock size={16} style={{marginRight: '5px'}} /> Training Objectives
                </div>
                
                <ul className="modal-list" style={{marginTop:'0.5rem', paddingLeft:'1rem', listStyle:'disc', color:'#cbd5e1'}}>
                    {selectedCourse.objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                    ))}
                </ul>
            </div>
            
            <div className="modal-footer">
                <div>
                    <span className="modal-price-label" style={{display:'block', fontSize:'0.8rem', color:'#94a3b8'}}>
                        Tuition Fee
                    </span>
                    <span className="modal-price-value" style={{fontSize:'1.5rem', fontWeight:'bold', color:'white'}}>
                        {selectedCourse.price}
                    </span>
                </div>
                <Link href="/enroll">
                    <button className="btn-gold" style={{fontSize: '0.9rem', padding: '0.8rem 1.5rem'}}>
                        Enroll Now
                    </button>
                </Link>
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