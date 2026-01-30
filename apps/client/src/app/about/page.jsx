'use client';

import React, { useState } from 'react';
import { 
  MapPin, Mail, Phone, 
  ChevronDown, Target, Eye
} from 'lucide-react';

// ✅ SHARED COMPONENTS
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/footer';

// ✅ STYLES
import '../../styles/marketing.css';

const AboutPage = () => {
  const [activeFaq, setActiveFaq] = useState(null); 

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="about-page-wrapper">
      
      {/* ✅ NAVBAR */}
      <Navbar />

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

        {/* --- BEAUTIFUL MISSION & VISION CARDS (Tailwind Style) --- */}
        <section className="mission-vision-section" style={{ 
            maxWidth: '1100px', 
            margin: '0 auto 8rem', 
            padding: '0 5%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '3rem',
            alignItems: 'stretch'
        }}>
            
            {/* 1. MISSION CARD (Gold Theme) */}
            <div style={{
                background: 'var(--bg-soft)',
                borderRadius: '12px',
                borderTop: '6px solid #fbbf24', /* Gold Top Border */
                borderLeft: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                padding: '2.5rem',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%' }}>
                        <Target size={28} color="#fbbf24" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.8rem', fontFamily: 'Playfair Display, serif', color: 'var(--text-main)' }}>Our Mission</h3>
                </div>

                <div style={{ color: 'var(--text-sub)', fontSize: '1rem', lineHeight: '1.7', flex: 1 }}>
                    <p style={{ marginBottom: '2rem' }}>
                        To provide comprehensive and professional training for individuals seeking to build a successful career as casino dealers. We are dedicated to equipping our students with the necessary skills and knowledge to excel in the competitive world of casinos.
                    </p>
                    
                    {/* Emphasis Block (Quote Style) */}
                    <div style={{ 
                        background: 'rgba(251, 191, 36, 0.05)', 
                        borderLeft: '4px solid #fbbf24', 
                        padding: '1.5rem', 
                        borderRadius: '0 8px 8px 0',
                    }}>
                        <p style={{ 
                            margin: 0, 
                            color: 'var(--text-main)', 
                            fontWeight: '600', 
                            fontStyle: 'italic',
                            fontSize: '0.95rem' 
                        }}>
                            "We take pride in offering training programs that cover all major casino games, including Craps, Racetrack Roulette, Blackjack and Poker."
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. VISION CARD (Blue Theme) */}
            <div style={{
                background: 'var(--bg-soft)',
                borderRadius: '12px',
                borderTop: '6px solid #3b82f6', /* Blue Top Border */
                borderLeft: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                padding: '2.5rem',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%' }}>
                        <Eye size={28} color="#3b82f6" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.8rem', fontFamily: 'Playfair Display, serif', color: 'var(--text-main)' }}>Our Vision</h3>
                </div>

                <div style={{ color: 'var(--text-sub)', fontSize: '1rem', lineHeight: '1.7', flex: 1 }}>
                    <p style={{ marginBottom: '2rem' }}>
                        We empower individuals with the expertise and confidence to traverse the globe while pursuing fulfilling careers as casino dealers. We aim to become the premier training center in the Philippines, renowned for delivering exceptional education.
                    </p>
                    
                    {/* Separator Line */}
                    <div style={{ height: '1px', background: 'var(--border)', width: '100%', marginBottom: '1.5rem', borderBottom: '1px dashed #94a3b8' }}></div>

                    <p>
                        <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Global Opportunities:</strong> 
                        We envision our graduates spreading their wings, traveling the world for free, and experiencing different cultures while honing their skills in the vibrant casino industry.
                    </p>
                </div>
            </div>

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

      {/* ✅ FOOTER */}
      <Footer />

    </div>
  );
};

export default AboutPage;