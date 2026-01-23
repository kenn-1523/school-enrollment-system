import AdminDashboard from '../../features/admin/AdminDashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  // Fetch students data server-side
  try {
    const res = await fetch('http://localhost:3001/api/admin/students', {
      headers: {
        'Cookie': `token=${token}`,
      },
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        redirect('/login');
      }
      throw new Error('Failed to fetch students');
    }

    // ✅ THE FIX: Unwrap the data
    const responseData = await res.json();
    
    // access .data because the API now returns { data: [...], pagination: {...} }
    const students = responseData.data || []; 

    return <AdminDashboard initialStudents={students} />;
  } catch (error) {
    console.error('Error fetching students:', error);
    redirect('/login');
  }
}