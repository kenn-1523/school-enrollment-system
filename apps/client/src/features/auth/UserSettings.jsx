import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const UserSettings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth || !auth.user) return navigate('/login', { replace: true });
    const parsed = auth.user;
    const id = parsed.id || parsed.student_id || parsed.id;
    axios.get(`https://mediumpurple-turtle-960137.hostingersite.com/backend_api/api/student/${id}`)
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading profile:', err.message || err);
        setLoading(false);
      });
  }, [navigate, auth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const id = user.student_id || user.id;
    // allowed fields to update
    const payload = {
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      email: user.email,
      mobile: user.mobile,
      dob: user.dob,
      city: user.city,
      country: user.country,
      education_level: user.education_level,
      employment_status: user.employment_status
    };

    axios.put(`https://mediumpurple-turtle-960137.hostingersite.com/backend_api/api/student/${id}`, payload)
      .then(res => {
        setSaving(false);
        // Update localStorage minimal user record if present
        // Update central auth context (also persists to localStorage)
        const p = auth.user ? { ...auth.user, firstName: user.first_name, username: user.username || auth.user.username } : null;
        if (p) auth.login(p);
        alert('Profile updated');
        navigate('/dashboard');
      })
      .catch(err => {
        setSaving(false);
        console.error('Save error:', err.message || err);
        alert('Failed to save profile');
      });
  };

  if (loading) return <div style={{padding:'2rem'}}>Loading profile...</div>;
  if (!user) return <div style={{padding:'2rem'}}>No profile data found.</div>;

  return (
    <div style={{minHeight:'100vh', padding:'2rem', background: '#f8fafc'}}>
      <div style={{maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
        <h2>Account Settings</h2>
        <p style={{color:'#64748b'}}>Update your personal information. Sensitive data is only editable here.</p>

        <form onSubmit={handleSave} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginTop:'1rem'}}>
          <label style={{display:'block'}}>
            First name
            <input name="first_name" value={user.first_name || ''} onChange={handleChange} style={{width:'100%', padding:'8px', marginTop:'6px'}} />
          </label>
          <label style={{display:'block'}}>
            Middle name
            <input name="middle_name" value={user.middle_name || ''} onChange={handleChange} style={{width:'100%', padding:'8px', marginTop:'6px'}} />
          </label>
          <label style={{display:'block'}}>
            Last name
            <input name="last_name" value={user.last_name || ''} onChange={handleChange} style={{width:'100%', padding:'8px', marginTop:'6px'}} />
          </label>
          <label style={{display:'block'}}>
            Email
            <input name="email" type="email" value={user.email || ''} onChange={handleChange} style={{width:'100%', padding:'8px', marginTop:'6px'}} />
          </label>
          <label style={{display:'block'}}>
            Mobile
            <input name="mobile" value={user.mobile || ''} onChange={handleChange} style={{width:'100%', padding:'8px', marginTop:'6px'}} />
          </label>
          <label style={{display:'block'}}>
            DOB
            <input name="dob" value={user.dob || ''} onChange={handleChange} type="date" style={{width:'100%', padding:'8px', marginTop:'6px'}} />
          </label>
          <label style={{display:'block'}}>
            City
            <input name="city" value={user.city || ''} onChange={handleChange} style={{width:'100%', padding:'8px', marginTop:'6px'}} />
          </label>
          <label style={{display:'block'}}>
            Country
            <input name="country" value={user.country || ''} onChange={handleChange} style={{width:'100%', padding:'8px', marginTop:'6px'}} />
          </label>
          <label style={{display:'block'}}>
            Education Level
            <input name="education_level" value={user.education_level || ''} onChange={handleChange} style={{width:'100%', padding:'8px', marginTop:'6px'}} />
          </label>
          <label style={{display:'block'}}>
            Employment Status
            <input name="employment_status" value={user.employment_status || ''} onChange={handleChange} style={{width:'100%', padding:'8px', marginTop:'6px'}} />
          </label>

          <div style={{gridColumn: '1 / -1', display:'flex', gap:'12px', marginTop:'6px'}}>
            <button type="submit" disabled={saving} style={{padding:'10px 16px', background:'#0f172a', color:'#fff', border:'none', borderRadius:'8px'}}>{saving ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" onClick={() => navigate('/dashboard')} style={{padding:'10px 16px', background:'#e5e7eb', border:'none', borderRadius:'8px'}}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSettings;
