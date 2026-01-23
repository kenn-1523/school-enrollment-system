'use client';

import React, { useState, useEffect } from 'react'; 
import Link from 'next/link'; 
import { usePathname } from 'next/navigation'; 
import { 
  Sun, Moon, Menu, X, PlayCircle, Globe, DollarSign, Award, 
  Spade, Crown, Dices, ArrowRight, Facebook, Linkedin, Instagram, Zap 
} from 'lucide-react'; 
import { useTheme } from '../../context/ThemeContext';
// Ensure your styles are imported correctly. 
// If using global css, you might not need this line if it's imported in layout.js
import './styles.css'; 

const LandingPage = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const { isDarkMode, toggleTheme } = useTheme();
  const pathname = usePathname(); 
// 3. UNIVERSAL SCROLL LISTENER
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.getElementById('navbar');
      // Check ALL possible scroll values to find the real one
      const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      
      if (navbar) {
        // If we have scrolled more than 20px...
        if (scrollPosition > 20) {
          navbar.style.background = '#0f172a'; 
          navbar.style.borderBottom = '1px solid #fbbf24';
          navbar.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
        } else {
          // If we are at the top...
          navbar.style.background = 'transparent';
          navbar.style.borderBottom = '1px solid transparent';
          navbar.style.boxShadow = 'none';
        }
      }
    };

    // Listen to BOTH window and document body just in case
    window.addEventListener('scroll', handleScroll);
    document.body.addEventListener('scroll', handleScroll);
    
    // Check immediately on load
    handleScroll(); 

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="landing-container">
      
      {/* --- NAVBAR (Logic handled by useEffect above) --- */}
      <nav className="navbar" id="navbar">
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

        <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`} id="navLinks">
            <Link href="/#" className="active" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/courses" onClick={() => setMobileMenuOpen(false)}>Courses</Link>
            <Link href="/enroll" className="mobile-enroll-btn" onClick={() => setMobileMenuOpen(false)}>Enroll Now</Link>
        </div>

<div className="nav-actions-container">
            
            {/* 1. THEME TOGGLE (Placed exactly here) */}
            <button 
                onClick={toggleTheme} 
                className="theme-toggle-btn" 
                aria-label="Toggle Theme"
            >
                {/* Shows Sun if Dark Mode is on, Moon if Light Mode is on */}
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            {/* 2. ENROLL BUTTON (Desktop) */}
            <div className="desktop-only-action">
                <Link href="/enroll">
                    <button className="btn-primary-nav">Enroll Now</button>
                </Link>
            </div>

            {/* 3. MOBILE MENU TOGGLE */}
            <div className="mobile-only-control">
                <button className="mobile-menu-btn" id="mobileMenuBtn" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </div>
      </nav>
      {/* --- HERO SECTION --- */}
      <header className="hero">
        <div className="hero-label">
            <span className="line"></span> GLOBAL CERTIFICATION
        </div>
        <h1>Master the Art of <br /><span>Casino Dealing</span></h1>
        <p>
            Welcome to Elite Croupier Training. We offer world-class online training 
            for aspiring croupiers looking to work abroad in luxury land-based casinos 
            or international cruise ships.
        </p>
        <div className="hero-buttons">
            <Link href="/courses" className="btn-gold">View Courses</Link>
            <Link href="/about" className="btn-transparent">
                <PlayCircle size={18} style={{marginRight: '8px'}} /> About Us
            </Link>
        </div>
        <div className="hero-footer">
            <div className="hero-feature"><Globe size={18} style={{marginRight: '8px'}} /> Work Globally</div>
            <div className="hero-feature"><DollarSign size={18} style={{marginRight: '8px'}} /> High Earning Potential</div>
            <div className="hero-feature"><Award size={18} style={{marginRight: '8px'}} /> Accredited Certification</div>
        </div>
      </header>

      {/* --- FEATURES SECTION --- */}
      <section className="features">
        <div className="section-header">
            <h3>Why Become a Croupier?</h3>
            <p>A high-demand career combining travel, luxury, and professional skills.</p>
        </div>
        <div className="feature-grid">
            <article className="feature-card">
                <div className="icon-box blue"><Globe size={24} /></div>
                <h4>High Demand</h4>
                <p>Consistent hiring due to fleet expansions on major cruise lines.</p>
            </article>
            <article className="feature-card">
                <div className="icon-box green"><DollarSign size={24} /></div>
                <h4>Great Earnings</h4>
                <p>Net $2,000 - $3,000 USD monthly with free food and lodging.</p>
            </article>
            <article className="feature-card">
                <div className="icon-box purple"><Zap size={24} /></div>
                <h4>Cost Advantage</h4>
                <p>Traditional schools cost $3,500+. Elite offers mastery for a fraction of the price.</p>
            </article>
        </div>
      </section>

      {/* --- COURSES SECTION (Playing Cards) --- */}
      <section className="courses-section">
        <div className="section-header">
            <h3>Popular Training Modules</h3>
            <p>Select a specialized path or get the full bundle.</p>
        </div>
        <div className="casino-grid">
            
            {/* CARD 1: Blackjack */}
            <article className="casino-card">
                <div className="card-rank-tl"><span>A</span><span className="suit-icon">♠</span></div>
                <div className="card-rank-br"><span>A</span><span className="suit-icon">♠</span></div>
                <div className="card-top">
                    <Spade className="card-icon" />
                </div>
                <h2>Blackjack Mastery</h2>
                <p>The essential dealing foundation. Master procedures from shuffling to payouts.</p>
                <div className="course-meta"><span>12 Hours</span><span>$250 USD</span></div>
                <Link href="/courses" className="card-btn">
                    View Details <ArrowRight width={16} style={{marginLeft: '5px'}} />
                </Link>
            </article>

            {/* CARD 2: Elite Bundle */}
            <article className="casino-card">
                <span className="course-badge">Best Value</span>
                <div className="card-rank-tl">
                    <span style={{color:'#fbbf24'}}>K</span>
                    <span className="suit-icon" style={{color:'#fbbf24'}}>♥</span>
                </div>
                <div className="card-rank-br">
                    <span style={{color:'#fbbf24'}}>K</span>
                    <span className="suit-icon" style={{color:'#fbbf24'}}>♥</span>
                </div>
                <div className="card-top">
                    <Crown className="card-icon" color="#fbbf24" />
                </div>
                <h2 style={{color:'#fbbf24'}}>Elite Master Bundle</h2>
                <p>All courses included: Blackjack, Poker, Roulette, Craps + Soft Skills.</p>
                <div className="course-meta">
                    <span style={{color:'#fbbf24'}}>Full Access</span>
                    <span style={{color:'#fbbf24'}}>$1,200 USD</span>
                </div>
                <Link href="/enroll" className="card-btn" style={{background:'white', color:'#0f172a'}}>
                    Enroll Now <ArrowRight width={16} style={{marginLeft: '5px'}} />
                </Link>
            </article>

            {/* CARD 3: Craps */}
            <article className="casino-card">
                <div className="card-rank-tl"><span>J</span><span className="suit-icon">♦</span></div>
                <div className="card-rank-br"><span>J</span><span className="suit-icon">♦</span></div>
                <div className="card-top">
                    <Dices className="card-icon" />
                </div>
                <h2>Craps Specialist</h2>
                <p>Advanced module. Master stick handling and proposition bets.</p>
                <div className="course-meta"><span>24 Hours</span><span>$400 USD</span></div>
                <Link href="/courses" className="card-btn">
                    View Details <ArrowRight width={16} style={{marginLeft: '5px'}} />
                </Link>
            </article>

        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section className="testimonials-section">
        <div className="section-header"><h3>Student Success Stories</h3></div>
        <div className="testimonial-grid">
            <article className="testimonial-card">
                <div className="stars">⭐⭐⭐⭐⭐</div>
                <blockquote>"The soft skills training made the difference. The recruiters were impressed."</blockquote>
                <div className="student-profile">
                    <div className="student-avatar">JD</div>
                    <div><strong>John D.</strong><span>Royal Caribbean</span></div>
                </div>
            </article>
            <article className="testimonial-card">
                <div className="stars">⭐⭐⭐⭐⭐</div>
                <blockquote>"I was nervous about the math, but the Roulette module broke it down perfectly."</blockquote>
                <div className="student-profile">
                    <div className="student-avatar">SM</div>
                    <div><strong>Sarah M.</strong><span>Carnival Cruise</span></div>
                </div>
            </article>
            <article className="testimonial-card">
                <div className="stars">⭐⭐⭐⭐⭐</div>
                <blockquote>"Worth every penny. The investment is nothing compared to the tax-free salary."</blockquote>
                <div className="student-profile">
                    <div className="student-avatar">MR</div>
                    <div><strong>Miguel R.</strong><span>Norwegian</span></div>
                </div>
            </article>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="cta-section">
        <div className="cta-content">
            <h2>Ready to See the World?</h2>
            <p>Start your journey today with our comprehensive starter bundle.</p>
            <Link href="/enroll">
                <button className="btn-white">Get Started Now</button>
            </Link>
        </div>
      </section>

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
                    <a href="https://www.facebook.com/edgarCroupierTrainingServices"><Facebook size={20} /></a>
                    <a href="#"><Linkedin size={20} /></a>
                    <a href="#"><Instagram size={20} /></a>
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

export default LandingPage;