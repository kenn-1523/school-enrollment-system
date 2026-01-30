'use client';
import React from 'react'; 
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/footer';
import Hero from '../../components/home/hero';
import Features from '../../components/home/Features';
import HomeCourseSection from '../../components/home/HomeCourseSection';
import { whyChooseUsData } from '@repo/business-logic';
import { Award, Briefcase, Layout } from 'lucide-react';
import './styles.css'; 

// Icon map for rendering
const iconMap = {
    Award: <Award size={48} />,
    Briefcase: <Briefcase size={48} />,
    Layout: <Layout size={48} />
};

const LandingPage = () => {
  return (
    <div className="landing-container">
      <Navbar />
      <Hero />
      <Features />
      
      <HomeCourseSection />

      {/* --- WHY TRAIN WITH US SECTION --- */}
      <section className="why-train-section">
          <div className="section-header">
              <h3>Why Train With Us?</h3>
              <p>Building confidence and trust in our new school with professional standards.</p>
          </div>
          <div className="why-train-grid">
              {whyChooseUsData.map((item, index) => (
                  <div key={index} className="why-train-card">
                      <div className="icon-container">
                          {iconMap[item.icon] || <Award size={48} />}
                      </div>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                  </div>
              ))}
          </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
            <h2>Ready to Launch Your Casino Career?</h2>
            <Link href="/enroll">
              <button className="btn-white">Get Started Now</button>
            </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;