'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Menu, X, Globe, Award, Shield, MapPin, Mail, Phone, 
  ChevronDown, Facebook, Linkedin, Instagram, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext'; 
// Assuming you split styles or use a global file. 
// If using the single styles.css you uploaded, ensure it's imported in layout.js or here.
import './styles.css';

const AboutPage = () => {
  // --- STATE MANAGEMENT ---
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null); // Track which FAQ is open

  const { isDarkMode, toggleTheme } = useTheme();

  // --- SCROLL EFFECT ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- FAQ TOGGLE HANDLER ---
  const toggleFaq = (index) => {
    if (activeFaq === index) {
      setActiveFaq(null); // Close if already open
    } else {
      setActiveFaq(index); // Open clicked
    }
  };

  return (
    <div className="about-page-wrapper">
      
      {/* --- NAVBAR --- */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo-container">
          <Link href="/" className="logo-link">
            <img 
              src="/images/clean-ects.png" 
              alt="ECTS Logo" 
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
          <Link href="/">Home</Link>
          <Link href="/about" className="active">About</Link>
          <Link href="/courses">Courses</Link>
          <Link href="/enroll" className="mobile-enroll-btn">Enroll Now</Link>
        </div>

{/* Inside AboutPage.jsx - Navbar Section */}
        <div className="nav-actions-container">
          
          {/* UPDATED: Clean Theme Toggle */}
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
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- HEADER --- */}
      <header className="about-header">
        <h1>About <span>Elite Croupier</span></h1>
        <p>The Gold Standard in Casino Training. Forging the next generation of world-class gaming professionals since 2010.</p>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="about-container">
        
        {/* HERO SECTION */}
        <section className="about-hero-section">
            <div className="about-text-content">
                <h2 className="about-subtitle" style={{ marginTop: 0 }}>A Legacy of Excellence</h2>
                <div className="about-text">
                    <p>
                        Founded by industry veterans with over 40 years of combined experience on the 
                        floors of Monte Carlo, Las Vegas, and Macau, Elite Croupier Training Academy was 
                        established with a singular mission: to forge the next generation of world-class 
                        casino professionals.
                    </p>
                    <p>
                        We don’t just teach the mechanics of dealing; we cultivate the poise, precision, and 
                        psychological acumen required to manage high-stakes action.
                    </p>
                </div>
            </div>

            {/* CARD VISUAL */}
            <div className="about-visual">
                <div className="premium-card-back"></div>
                <div className="css-playing-card">
                    <div className="fancy-inner-border"></div>
                    <div className="card-corner">
                        <span>A</span>
                        <span style={{ color: '#fbbf24' }}>♠</span>
                    </div>
                    <div className="card-center">♠</div>
                    <div className="card-corner bottom">
                        <span>A</span>
                        <span style={{ color: '#fbbf24' }}>♠</span>
                    </div>
                </div>
            </div>
        </section>

        {/* PHILOSOPHY SECTION */}
        <h3 className="contact-header">Our Philosophy</h3>
        <section className="values-grid-section">
            <article className="value-card">
                <div className="value-icon-box">
                    <Globe size={24} />
                </div>
                <h3>Global Reach</h3>
                <p>Our academy has successfully placed graduates in prestigious venues across 5 continents and leading cruise lines.</p>
            </article>
            <article className="value-card">
                <div className="value-icon-box">
                    <Award size={24} />
                </div>
                <h3>White Glove Method</h3>
                <p>We combine rigorous technical drilling with soft-skills training in conflict resolution and VIP protocol.</p>
            </article>
            <article className="value-card">
                <div className="value-icon-box">
                    <Shield size={24} />
                </div>
                <h3>Floor Ready</h3>
                <p>Our alumni are trained to handle live action from day one, minimizing the learning curve for employers.</p>
            </article>
        </section>

        {/* CONTACT SECTION */}
        <section className="contact-section">
            <h3 className="contact-header">Contact Us</h3>
            <div className="contact-grid">
                <div className="contact-card">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <MapPin color="#fbbf24" size={32} />
                    </div>
                    <span className="contact-label">Headquarters</span>
                    <span className="contact-value">Heart Building, Makati City, PH</span>
                </div>
                <div className="contact-card">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Mail color="#fbbf24" size={32} />
                    </div>
                    <span className="contact-label">Email</span>
                    <span className="contact-value">admissions@elitecroupier.com</span>
                </div>
                <div className="contact-card">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Phone color="#fbbf24" size={32} />
                    </div>
                    <span className="contact-label">Phone</span>
                    <span className="contact-value">+63 2 8123 4567</span>
                </div>
            </div>
        </section>

        {/* FAQ SECTION */}
        <section className="faq-section">
            <h3 className="contact-header">Frequently Asked Questions</h3>
            <div className="faq-list">
                
                {/* FAQ Item 1 */}
                <div className="faq-item">
                    <button className="faq-question" onClick={() => toggleFaq(0)}>
                        Do I need previous experience?
                        <ChevronDown 
                            className="faq-icon" 
                            style={{ transform: activeFaq === 0 ? 'rotate(180deg)' : 'rotate(0deg)' }} 
                        />
                    </button>
                    <div className="faq-answer" style={{ display: activeFaq === 0 ? 'block' : 'none' }}>
                        No prior casino experience is required. Our curriculum is designed to take absolute beginners and train them to professional standards.
                    </div>
                </div>

                {/* FAQ Item 2 */}
                <div className="faq-item">
                    <button className="faq-question" onClick={() => toggleFaq(1)}>
                        Is job placement guaranteed?
                        <ChevronDown 
                            className="faq-icon" 
                            style={{ transform: activeFaq === 1 ? 'rotate(180deg)' : 'rotate(0deg)' }} 
                        />
                    </button>
                    <div className="faq-answer" style={{ display: activeFaq === 1 ? 'block' : 'none' }}>
                        While no reputable institution can guarantee a job, we have a 94% placement rate. Our extensive network of casino partners actively recruits from our graduating classes.
                    </div>
                </div>

                {/* FAQ Item 3 */}
                <div className="faq-item">
                    <button className="faq-question" onClick={() => toggleFaq(2)}>
                        How long is the training?
                        <ChevronDown 
                            className="faq-icon" 
                            style={{ transform: activeFaq === 2 ? 'rotate(180deg)' : 'rotate(0deg)' }} 
                        />
                    </button>
                    <div className="faq-answer" style={{ display: activeFaq === 2 ? 'block' : 'none' }}>
                        Our comprehensive 'Zero to Hero' program is an intensive 8-week course. Specialized modules like Poker or Craps can be taken separately.
                    </div>
                </div>

            </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div className="footer-content">
            <div className="footer-brand">
                <h3>Elite Croupier Academy</h3>
                <p>Infotech division of Segovia Group</p>
                <address className="footer-address">
                    Heart Building, 7461 Bagtikan St.<br />
                    Makati City, Philippines
                </address>
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
};

export default AboutPage;