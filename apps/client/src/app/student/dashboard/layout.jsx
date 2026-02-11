'use client';

export default function StudentDashboardLayout({ children }) {
  // We strictly render the children. 
  // All security logic is now inside page.jsx (Admin Style)
  return (
    <>
      {children}
    </>
  );
}