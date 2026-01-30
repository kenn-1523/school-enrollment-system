import React from 'react';
import Link from 'next/link';
import { PlayCircle, Globe, DollarSign, Award } from 'lucide-react';

export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-content">
        <div className="hero-text">
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
        </div>
        <div className="hero-image">
          <img 
            src="/images/clean-ects.png" 
            alt="ECTS Logo" 
            onError={(e) => e.target.style.display='none'}
          />
        </div>
      </div>
      <div className="hero-footer">
          <div className="hero-feature"><Globe size={18} style={{marginRight: '8px'}} /> Work Globally</div>
          <div className="hero-feature"><DollarSign size={18} style={{marginRight: '8px'}} /> High Earning Potential</div>
          <div className="hero-feature"><Award size={18} style={{marginRight: '8px'}} /> Accredited Certification</div>
      </div>
    </header>
  );
}