import React from 'react';
import { Spade, Crown, Dices, ArrowRight, Trophy, CheckCircle, Plus, BookOpen } from 'lucide-react';

export default function CourseCard({ course, isSelected, onSelect, isFreeIncluded, onViewDetails }) {
  
  // Style config
  const isGold = course.title.includes('Bundle');
  const textColor = isGold ? '#fbbf24' : 'inherit';
  const suits = ['♠', '♥', '♦', '♣'];
  const suit = suits[course.code.charCodeAt(0) % 4] || '♠'; 

  // Icon Helper
  const getIcon = () => {
    if (course.title.includes('Blackjack')) return <Spade className="card-icon" />;
    if (course.title.includes('Bundle')) return <Crown className="card-icon" color="#fbbf24" />;
    if (course.title.includes('Craps')) return <Dices className="card-icon" />;
    return <BookOpen className="card-icon" />;
  };

  // Logic: It is active if (It is Paid AND Selected) OR (It is Free AND FreeIncluded is true)
  const isActive = course.isPaid ? isSelected : isFreeIncluded;

  return (
    <article 
      className={`casino-card ${isActive ? 'calc-active' : ''}`} 
      style={{
          position: 'relative', 
          border: isActive ? '2px solid #fbbf24' : ''
      }}
    >
      {/* --- BADGES --- */}
      {course.isPaid ? (
          <div 
              onClick={(e) => { e.stopPropagation(); onSelect(course.code); }}
              className="card-action-badge"
              style={{
                  position: 'absolute', top: '15px', right: '15px', zIndex: 10,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                  background: isSelected ? '#fbbf24' : 'rgba(0,0,0,0.6)',
                  padding: '8px 12px', borderRadius: '20px',
                  color: isSelected ? 'black' : 'white', fontWeight: 'bold', fontSize: '0.8rem',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.2s'
              }}
          >
              {isSelected ? <CheckCircle size={14}/> : <Plus size={14}/>}
              {isSelected ? 'Selected' : 'Add'}
          </div>
      ) : (
          /* Free Course Badge */
          isActive && (
              <div style={{
                  position: 'absolute', top: '15px', right: '15px', zIndex: 10,
                  background: '#22c55e', color: 'white', 
                  padding: '5px 12px', borderRadius: '20px', 
                  fontWeight: 'bold', fontSize: '0.75rem',
                  display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                 <CheckCircle size={14} /> Included Free
              </div>
          )
      )}

      {/* Decorative Corners */}
      <div className="card-rank-tl"><span>{course.code[0]}</span><span className="suit-icon">{suit}</span></div>
      <div className="card-rank-br"><span>{course.code[0]}</span><span className="suit-icon">{suit}</span></div>

      <div className="card-top">{getIcon()}</div>

      <h2>{course.title}</h2>
      <p>{course.desc || course.description}</p>

      <div className="course-price-tag" style={{color: '#fbbf24', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center'}}>
          {course.displayPrice}
      </div>

      <button onClick={() => onViewDetails(course)} className="card-btn">
          View Details <ArrowRight width={16} style={{ marginLeft: '5px' }} />
      </button>
    </article>
  );
}