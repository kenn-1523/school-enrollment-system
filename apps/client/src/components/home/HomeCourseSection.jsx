import React from 'react';
import { useRouter } from 'next/navigation';
import CourseCard from '../courses/CourseCard';
import { coursesData } from '@repo/business-logic'; // Importing your Single Source of Truth

const courses = coursesData;

export default function HomeCourseSection() {
  const router = useRouter();

  // We only want to show 3 specific courses on the homepage, not all of them.
  // Let's pick Blackjack (G1), The Bundle, and Craps (G5).
  const featuredCourses = [
    courses.find(c => c.title.includes('Black Jack')),
    {
      ...courses.find(c => c.title.includes('Black Jack')),
      title: 'Elite Master Bundle',
      displayPrice: '$1,575 USD',
      desc: 'All courses included: Blackjack, Poker, Roulette, Craps + Soft Skills.',
      isBundle: true
    },
    courses.find(c => c.title.includes('Craps'))
  ].filter(Boolean); // Removes any undefined items if data is missing

  const handleViewDetails = (course) => {
    // simplest: send user to courses page
    // you can change this later to open a modal if you want
    router.push('/courses');
  };

  return (
    <section className="courses-section">
      <div className="section-header">
        <h3>Popular Training Modules</h3>
        <p>Select a specialized path or get the full bundle.</p>
      </div>

      <div className="casino-grid">
        {featuredCourses.map((course, index) => (
          <CourseCard
            key={index}
            course={course}
            isFeatured={course.isBundle}
            onViewDetails={handleViewDetails}   // ✅ FIX: always a function now
          />
        ))}
      </div>
    </section>
  );
}
