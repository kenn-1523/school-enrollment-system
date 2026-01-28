'use client'; // <--- Mandatory for Hostinger

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ✅ CONNECTION PRESERVED: This links to your existing Dashboard file
import AdminDashboard from '../../features/admin/AdminDashboard'; 

export default function AdminPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get the token from the Browser (instead of the Server)
      // We check localStorage first, as that is standard for client-side apps
      const token = localStorage.getItem('token'); 
      
      if (!token) {
        router.push('/login'); // Redirect if no key found
        return;
      }

      try {
        // 2. Fetch the data from your Backend
        // Note: Keep 'localhost' for now while testing, but change to your live API link later
        const res = await fetch('https://mediumpurple-turtle-960137.hostingersite.com/backend_api/api/admin/students', {
          headers: {
            // We send the token so the backend allows us in
            'Authorization': `Bearer ${token}` 
          }
        });

        if (!res.ok) {
           if (res.status === 401 || res.status === 403) router.push('/login');
           throw new Error('Failed to fetch');
        }

        const responseData = await res.json();
        
        // 3. Save the data we found
        setStudents(responseData.data || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Loading screen prevents the page from flashing empty
  if (isLoading) {
    return <div className="p-10 text-center">Loading Admin System...</div>;
  }

  // ✅ CONNECTION PRESERVED: Passing the data exactly how your component expects it
  return <AdminDashboard initialStudents={students} />;
}