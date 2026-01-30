import React from 'react';
import { Globe, DollarSign, Zap } from 'lucide-react';
import { whyChooseUsData } from '@repo/business-logic';

export default function Features() {
  return (
    <section className="features">
      <div className="section-header">
          <h3>Why Train With Us?</h3>
          <p>Professional instruction and resources to launch your casino career.</p>
      </div>
      <div className="feature-grid">
          {whyChooseUsData.map((feature, index) => (
              <article key={index} className="feature-card">
                  <div className="icon-box blue">{index === 0 ? <Globe size={24} /> : index === 1 ? <DollarSign size={24} /> : <Zap size={24} />}</div>
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
              </article>
          ))}
      </div>
    </section>
  );
}