import React from 'react';
import Link from 'next/link';
import { Facebook, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  return (
      <footer className="footer">
        <div className="footer-content">
            <div className="footer-brand">
                <h3>Elite Croupier Academy</h3>
                <p>Infotech division of Segovia Group</p>
                
                {/* Updated Address & Contact Section */}
                <address className="footer-address" style={{ fontStyle: 'normal', lineHeight: '1.8' }}>
                    1144 Chino Roces Ave, Village, Heartland, <br/>
                    Makati City, 1203 Metro Manila
                    <span style={{ display: 'block', marginTop: '10px' }}>
                        Phone: +63 923 893 6457, +63 8683 0225
                    </span>
                    <span style={{ display: 'block' }}>
                        Email: edgarcts@yahoo.com
                    </span>
                </address>
            </div>
            
            <div className="footer-legal">
                <div className="social-icons">
                    <a href="https://www.facebook.com/edgarCroupierTrainingServices" target="_blank" rel="noopener noreferrer"><Facebook size={20} /></a>
                    <a href="#"><Linkedin size={20} /></a>
                    <a href="#"><Instagram size={20} /></a>
                </div>
            </div>
        </div>
        
        <div className="copyright-row">
            <span>© 2026 SGWebworks. All rights reserved.</span>
            <div className="legal-links">
                <Link href="/privacy">Privacy Policy</Link>
                <span className="separator">|</span>
                <Link href="/terms">Terms of Service</Link>
            </div>
        </div>
      </footer>
  );
}