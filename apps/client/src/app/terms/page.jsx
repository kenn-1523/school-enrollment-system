'use client';

import React from 'react';
import Link from 'next/link';
import { Video, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/footer';
import { VIDEO_POLICY } from '@repo/business-logic'; 

// ✅ NEW CSS IMPORT
import '../../styles/marketing.css'; 
import '../../styles/policy.css'; 

export default function TermsPage() {
  return (
    <div className="landing-container">
      <Navbar />
      
      {/* ✅ NEW HERO SECTION */}
      <header className="policy-hero">
        <div>
            <h1>Training <span>Terms</span></h1>
            <p><AlertCircle size={16} color="#3b82f6" /> Last Updated: {VIDEO_POLICY.lastUpdated}</p>
        </div>
      </header>

      <main className="policy-container">
        {/* CARD */}
        <div className="policy-card">
            {/* Blue Top Accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: '#3b82f6' }}></div>
            
            <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'Playfair Display', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Video size={28} color="#3b82f6" /> {VIDEO_POLICY.title}
                </h2>
                <p style={{ marginTop: '0.5rem' }}>{VIDEO_POLICY.intro}</p>
            </div>

            {VIDEO_POLICY.sections.map((section, index) => (
                <section key={section.id} style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.25rem' }}>{index + 1}. {section.title}</h3>
                    
                    {section.highlight ? (
                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <p style={{ margin: 0, color: 'var(--text-main)', fontWeight: '600' }}>{section.content}</p>
                        </div>
                    ) : (
                        <p style={{ lineHeight: '1.7', marginBottom: '1rem' }}>{section.content}</p>
                    )}

                    {section.items && (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {section.items.map((item, i) => (
                                <li key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                                    <CheckCircle size={16} color="#3b82f6" /> {item}
                                </li>
                            ))}
                        </ul>
                    )}

                    {section.contentAfter && (
                        <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>{section.contentAfter}</p>
                    )}

                    {section.warning && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', color: '#fca5a5', marginTop: '1rem' }}>
                            <AlertCircle size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#ef4444' }}>{section.warning}</p>
                        </div>
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