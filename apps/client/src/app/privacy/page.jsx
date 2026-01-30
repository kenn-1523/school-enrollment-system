'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ChevronLeft, Info, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/footer';
import { PRIVACY_POLICY } from '@repo/business-logic'; 

// ✅ NEW CSS IMPORT
import '../../styles/marketing.css'; 
import '../../styles/policy.css'; 

export default function PrivacyPage() {
  return (
    <div className="landing-container">
      <Navbar />
      
      {/* ✅ NEW HERO SECTION */}
      <header className="policy-hero">
        <div>
            <h1>Privacy <span>Policy</span></h1>
            <p><AlertCircle size={16} color="#fbbf24" /> Last Updated: {PRIVACY_POLICY.lastUpdated}</p>
        </div>
      </header>

      <main className="policy-container">
        {/* CARD */}
        <div className="policy-card">
            {/* Gold Top Accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: '#fbbf24' }}></div>

            <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Info size={24} color="#fbbf24" /> Introduction
                </h3>
                <p style={{ lineHeight: '1.7' }}>{PRIVACY_POLICY.intro}</p>
            </section>

            {PRIVACY_POLICY.sections.map((section, index) => (
                <section key={section.id} style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.25rem' }}>
                        {index + 1}. {section.title}
                    </h3>
                    <p style={{ lineHeight: '1.7', marginBottom: '1rem' }}>{section.content}</p>
                    
                    {section.items && (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {section.items.map((item, i) => (
                                <li key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                                    <div style={{ width: '6px', height: '6px', background: '#fbbf24', borderRadius: '50%' }}></div> {item}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            ))}
        </div>

        {/* RETURN NAV */}
        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
            <Link href="/" className="btn-policy-return">
                <ChevronLeft size={20} /> Return to Home
            </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}