import React from 'react';
import Link from 'next/link';
import { XCircle, Calendar, Clock } from 'lucide-react';

export default function CourseModal({ course, isOpen, onClose, onToggleSelect, isSelected }) {
  if (!isOpen || !course) return null;

  return (
    <div className="modal-overlay" style={{opacity: 1, visibility: 'visible'}} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
            <span className="modal-course-badge">{course.code} | COURSE DETAIL</span>
            <button className="modal-close-btn" onClick={onClose}><XCircle size={24} /></button>
        </div>
        
        <div className="modal-body">
            <h3 className="modal-title" style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>
                {course.title}
            </h3>
            <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#fbbf24', fontSize:'0.9rem', marginBottom:'1rem'}}>
               <Calendar size={16} /> Duration: {course.duration}
            </div>
            <p className="modal-desc" style={{color: '#94a3b8'}}>{course.desc || course.description}</p>
            
            <div className="modal-section-title" style={{marginTop:'1rem', display:'flex', alignItems:'center', color:'#fbbf24', fontWeight:'bold'}}>
                <Clock size={16} style={{marginRight: '5px'}} /> Training Objectives
            </div>
            <ul className="modal-list" style={{marginTop:'0.5rem', paddingLeft:'1rem', listStyle:'disc', color:'#cbd5e1'}}>
                {course.objectives && course.objectives.map((obj, i) => (<li key={i}>{obj}</li>))}
            </ul>
        </div>
        
        <div className="modal-footer">
            <div>
                <span className="modal-price-label" style={{display:'block', fontSize:'0.8rem', color:'#94a3b8'}}>Tuition Fee</span>
                <span className="modal-price-value" style={{fontSize:'1.5rem', fontWeight:'bold', color:'white'}}>
                    {course.displayPrice}
                </span>
            </div>
            {course.isPaid ? (
                <button className="btn-gold-sm" onClick={() => onToggleSelect(course.code)}>
                    {isSelected ? 'Remove' : 'Select'}
                </button>
            ) : (
                <Link href="/enroll"><button className="btn-gold-sm">Enroll Now</button></Link>
            )}
        </div>
      </div>
    </div>
  );
}