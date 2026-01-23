'use client';

import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, Sun, Moon, ArrowLeft, ChevronRight, ChevronLeft, 
  UploadCloud, User, BookOpen, Briefcase, FileText, Lock, 
  Loader, Clock, CheckSquare, Square, CheckCircle, MapPin, 
  AlertCircle, Info, ChevronDown
} from 'lucide-react';

// --- GLOBAL ADDRESS LIBRARY ---
// Run: npm install country-state-city --legacy-peer-deps
import { Country, State, City } from 'country-state-city';

// Use your global styles
import './styles.css'; 
import { useTheme } from '../../context/ThemeContext';

// --- DATA: PHILIPPINE REGIONS & PROVINCES ---
const PH_REGIONS = {
  "NCR (National Capital Region)": ["Metro Manila"],
  "CAR (Cordillera Administrative Region)": ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province"],
  "Region I (Ilocos Region)": ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
  "Region II (Cagayan Valley)": ["Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"],
  "Region III (Central Luzon)": ["Aurora", "Bataan", "Bulacan", "Nueva Ecija", "Pampanga", "Tarlac", "Zambales"],
  "Region IV-A (CALABARZON)": ["Batangas", "Cavite", "Laguna", "Quezon", "Rizal"],
  "Region IV-B (MIMAROPA)": ["Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon"],
  "Region V (Bicol Region)": ["Albay", "Camarines Norte", "Camarines Sur", "Catanduanes", "Masbate", "Sorsogon"],
  "Region VI (Western Visayas)": ["Aklan", "Antique", "Capiz", "Guimaras", "Iloilo", "Negros Occidental"],
  "Region VII (Central Visayas)": ["Bohol", "Cebu", "Negros Oriental", "Siquijor"],
  "Region VIII (Eastern Visayas)": ["Biliran", "Eastern Samar", "Leyte", "Northern Samar", "Samar", "Southern Leyte"],
  "Region IX (Zamboanga Peninsula)": ["Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay"],
  "Region X (Northern Mindanao)": ["Bukidnon", "Camiguin", "Lanao del Norte", "Misamis Occidental", "Misamis Oriental"],
  "Region XI (Davao Region)": ["Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental"],
  "Region XII (SOCCSKSARGEN)": ["Cotabato", "Sarangani", "South Cotabato", "Sultan Kudarat"],
  "Region XIII (Caraga)": ["Agusan del Norte", "Agusan del Sur", "Dinagat Islands", "Surigao del Norte", "Surigao del Sur"],
  "BARMM": ["Basilan", "Lanao del Sur", "Maguindanao", "Sulu", "Tawi-Tawi"]
};

const EnrollPage = () => {
  // --- STATE ---
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const pathname = usePathname();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null); 
  const [alertState, setAlertState] = useState({ show: false, message: '', type: 'error' });

  // --- ADDRESS STATE ---
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);     // For International States
  const [cities, setCities] = useState([]);     // For International Cities
  
  // Philippine Specific State
  const [phProvinceOptions, setPhProvinceOptions] = useState([]);

  // ISO Codes for library fetching
  const [selectedCountryISO, setSelectedCountryISO] = useState('');
  const [selectedStateISO, setSelectedStateISO] = useState('');

  const idFileRef = useRef(null);
  const birthCertRef = useRef(null); 
  const topRef = useRef(null);

  // --- INIT ---
  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Load Countries
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [formData, setFormData] = useState({
    email: '', mobile: '',
    entryDate: '', scholarshipType: 'Paying',
    selectedCourses: [], 
    lastName: '', firstName: '', middleName: '',
    
    street: '', city: '', province: '', region: '', country: '', 
    zipCode: '',
    
    sex: 'Male', civilStatus: 'Single', dob: '', 
    educationLevel: '', employmentStatus: 'Unemployed', 
    privacyConsent: false,
    idFile: null, 
    birthCertFile: null 
  });

  const allCourses = [
    { id: 1, code: 'F1', name: 'Introduction to Casino Gaming' },
    { id: 2, code: 'G1', name: 'Blackjack Mastery' },
    { id: 3, code: 'G2', name: 'Poker Dealing' },
    { id: 4, code: 'G3', name: 'Baccarat' },
    { id: 5, code: 'G4', name: 'Roulette' },
    { id: 6, code: 'G5', name: 'Craps Specialist' },
    { id: 7, code: 'C1', name: 'Communication Skills' },
    { id: 8, code: 'C2', name: 'Etiquette & Guest Relations' }
  ];

  const visibleCourseOptions = allCourses.filter(c => [2, 3, 4, 5, 6].includes(c.id));
  const FREE_BUNDLE_IDS = [1, 7, 8];

  // --- HELPERS ---
  const showAlert = (message, type = 'error') => {
    setAlertState({ show: true, message, type });
    setTimeout(() => setAlertState(prev => ({ ...prev, show: false })), 4000);
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'privacyConsent') setFormData({ ...formData, [name]: checked });
    else setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
      const { name, files } = e.target;
      if (files && files[0]) setFormData({ ...formData, [name]: files[0] });
  };

  const toggleCourse = (courseId) => {
    let updated = [...formData.selectedCourses];
    if (updated.includes(courseId)) updated = updated.filter(id => id !== courseId);
    else updated.push(courseId);
    setFormData({ ...formData, selectedCourses: updated });
  };

  // ==========================================
  // 🌍 SMART ADDRESS LOGIC (SEARCHABLE)
  // ==========================================

  // 1. COUNTRY CHANGE (Searchable)
  const handleCountryChange = (e) => {
      const countryName = e.target.value; // User types name
      
      // Find ISO code based on Name
      const countryObj = countries.find(c => c.name === countryName);
      const isoCode = countryObj ? countryObj.isoCode : '';
      
      setSelectedCountryISO(isoCode);
      setFormData(prev => ({ ...prev, country: countryName, region: '', province: '', city: '' }));

      if (countryName === "Philippines") {
          // Switch to PH Logic
          setStates([]); 
          setCities([]);
          setPhProvinceOptions([]);
      } else if (isoCode) {
          // Switch to International Logic
          setStates(State.getStatesOfCountry(isoCode));
          setCities([]);
      }
  };

  // 2. PH REGION CHANGE (Searchable)
  const handlePhRegionChange = (e) => {
      const region = e.target.value;
      setPhProvinceOptions(PH_REGIONS[region] || []);
      setFormData(prev => ({ ...prev, region: region, province: '', city: '' })); 
  };

  // 3. PH PROVINCE CHANGE (Searchable)
  const handlePhProvinceChange = (e) => {
      const prov = e.target.value;
      setFormData(prev => ({ ...prev, province: prov, city: '' }));
  };

  // 4. INT'L STATE CHANGE (Searchable)
  const handleIntlStateChange = (e) => {
      const stateName = e.target.value;
      
      // Find State ISO by Name
      const stateObj = states.find(s => s.name === stateName);
      const stateIso = stateObj ? stateObj.isoCode : '';

      setSelectedStateISO(stateIso);
      
      if (stateIso && selectedCountryISO) {
        setCities(City.getCitiesOfState(selectedCountryISO, stateIso)); 
      }

      setFormData(prev => ({
          ...prev,
          region: stateName, // Map State -> Region column in DB
          province: stateName,
          city: ''
      }));
  };

  // 5. CITY CHANGE (Searchable for everyone)
  const handleCityChange = (e) => {
      setFormData(prev => ({ ...prev, city: e.target.value }));
  };

  // --- VALIDATION ---
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const validateStep = (step) => {
    switch (step) {
      case 1: 
        if (!formData.firstName || !formData.lastName || !formData.dob) { showAlert('Please fill in Name and Birth Date.', 'error'); return false; }
        if (!formData.email || !formData.mobile) { showAlert('Contact details required.'); return false; }
        
        // ✅ NEW CHECK: Education and Employment
        if (!formData.educationLevel) { showAlert('Please select Education Level.', 'error'); return false; }
        if (!formData.employmentStatus) { showAlert('Please select Employment Status.', 'error'); return false; }

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(formData.email)) { showAlert('Invalid Email Format.', 'error'); return false; }

        const cleanMobile = formData.mobile.replace(/[^0-9]/g, '');
        if (cleanMobile.length < 7 || cleanMobile.length > 15) { showAlert('Invalid mobile number.', 'error'); return false; }

        const birthDate = new Date(formData.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

        if (age < 18) { showAlert('Must be 18+ to enroll.', 'error'); return false; }
        if (age > 100) { showAlert('Invalid birth year.', 'error'); return false; }

        // Address Check
        if (!formData.country || !formData.region || !formData.city) { 
            showAlert('Complete address required.', 'error'); return false; 
        }
        if (formData.country === 'Philippines' && !formData.province) {
            showAlert('Please select a province.', 'error'); return false;
        }

        return true;

      case 2:
        if (!formData.entryDate) { showAlert('Select Start Date.', 'error'); return false; }
        if (formData.selectedCourses.length === 0) { showAlert('Select at least one course.', 'error'); return false; }
        return true;

      default: return true;
    }
  };

  const nextStep = () => { if (validateStep(currentStep)) { window.scrollTo(0,0); setCurrentStep(prev => Math.min(prev + 1, 3)); }};
  const prevStep = () => { window.scrollTo(0,0); setCurrentStep(prev => Math.max(prev - 1, 1)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalCourses = [...new Set([...formData.selectedCourses, ...FREE_BUNDLE_IDS])];
    const subData = new FormData();
    
    Object.keys(formData).forEach(key => {
        if (key === 'selectedCourses') subData.append(key, JSON.stringify(finalCourses)); 
        else if (key !== 'idFile' && key !== 'birthCertFile') subData.append(key, formData[key]);
    });

    if (formData.idFile) subData.append('idFile', formData.idFile);
    if (formData.birthCertFile) subData.append('birthCertFile', formData.birthCertFile);

    try {
      const res = await axios.post('http://localhost:3001/api/enroll', subData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setSuccessData({ id: res.data.id || 'Pending' });
      window.scrollTo(0,0);
      setCurrentStep(4);
      showAlert('Application Submitted Successfully!', 'success');
    } catch (err) {
      showAlert('Registration failed. ' + (err.response?.data?.message || 'Server error.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- STEP 1: PERSONAL & ADDRESS ---
  const renderStep1 = () => (
    <div className="animate-fade-in">
      <div className="section-block">
        <h3 className="section-header-modern"><User className="text-blue-600"/> 1. Personal Information</h3>
        <div className="form-grid-3">
          <div className="modern-input-group"><label>Last Name *</label><input className="modern-input" name="lastName" value={formData.lastName} onChange={handleChange} /></div>
          <div className="modern-input-group"><label>First Name *</label><input className="modern-input" name="firstName" value={formData.firstName} onChange={handleChange} /></div>
          <div className="modern-input-group"><label>Middle Name</label><input className="modern-input" name="middleName" onChange={handleChange} /></div>
        </div>
        
        <div className="form-grid-3">
           <div className="modern-input-group"><label>Birth Date *</label><input className="modern-input" type="date" name="dob" value={formData.dob} onChange={handleChange} /></div>
           <div className="modern-input-group"><label>Sex *</label><select className="modern-select" name="sex" value={formData.sex} onChange={handleChange}><option>Male</option><option>Female</option></select></div>
           <div className="modern-input-group"><label>Civil Status</label><select className="modern-select" name="civilStatus" value={formData.civilStatus} onChange={handleChange}><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option></select></div>
        </div>

        {/* ✅ ADDED: Missing Education & Employment Inputs */}
        <div className="form-grid-2" style={{marginTop:'15px'}}>
            <div className="modern-input-group">
                <label>Education Level *</label>
                <select className="modern-select" name="educationLevel" value={formData.educationLevel} onChange={handleChange}>
                    <option value="" disabled>Select Level</option>
                    <option value="High School">High School</option>
                    <option value="College Undergraduate">College Undergraduate</option>
                    <option value="College Graduate">College Graduate</option>
                    <option value="Vocational">Vocational</option>
                </select>
            </div>
            <div className="modern-input-group">
                <label>Employment Status *</label>
                <select className="modern-select" name="employmentStatus" value={formData.employmentStatus} onChange={handleChange}>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Employed">Employed</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Student">Student</option>
                </select>
            </div>
        </div>
      </div>

      <div className="section-block" style={{marginTop:'2rem'}}>
        <h3 className="section-header-modern"><MapPin className="text-blue-600"/> 2. Address</h3>
        
        {/* ROW 1: Country & Region/State */}
        <div className="form-grid-2">
           <div className="modern-input-group">
              <label>Country *</label>
              <input 
                list="country-options" 
                className="modern-input" 
                value={formData.country} 
                onChange={handleCountryChange} 
                placeholder="Type to search country..."
                autoComplete="off"
              />
              <datalist id="country-options">
                  {countries.map((c) => (
                      <option key={c.isoCode} value={c.name} />
                  ))}
              </datalist>
           </div>
           
           <div className="modern-input-group">
                <label>{formData.country === 'Philippines' ? 'Region *' : 'State / Province *'}</label>
                {formData.country === 'Philippines' ? (
                    <>
                        <input 
                            list="ph-region-options" 
                            className="modern-input" 
                            value={formData.region} 
                            onChange={handlePhRegionChange} 
                            placeholder="Search Region..."
                            autoComplete="off"
                        />
                        <datalist id="ph-region-options">
                            {Object.keys(PH_REGIONS).map((reg) => (
                                <option key={reg} value={reg} />
                            ))}
                        </datalist>
                    </>
                ) : (
                    <>
                        <input 
                            list="intl-state-options" 
                            className="modern-input" 
                            value={formData.region} 
                            onChange={handleIntlStateChange} 
                            placeholder="Search State/Province..."
                            disabled={!selectedCountryISO}
                            autoComplete="off"
                        />
                        <datalist id="intl-state-options">
                            {states.map((s) => (
                                <option key={s.isoCode} value={s.name} />
                            ))}
                        </datalist>
                    </>
                )}
           </div>
        </div>

        {/* ROW 2: Province (PH) + City */}
        <div className="form-grid-2">
           {formData.country === 'Philippines' && (
               <div className="modern-input-group">
                    <label>Province *</label>
                    <input 
                        list="ph-province-options" 
                        className="modern-input" 
                        value={formData.province} 
                        onChange={handlePhProvinceChange} 
                        placeholder="Search Province..."
                        disabled={!formData.region}
                        autoComplete="off"
                    />
                    <datalist id="ph-province-options">
                        {phProvinceOptions.map((prov) => (
                            <option key={prov} value={prov} />
                        ))}
                    </datalist>
               </div>
           )}

           <div className="modern-input-group">
                <label>City / Municipality *</label>
                <input 
                    list="city-options" 
                    className="modern-input"
                    name="city"
                    value={formData.city} 
                    onChange={handleCityChange}
                    placeholder="Type to search or enter city..."
                    disabled={formData.country === 'Philippines' && !formData.province}
                    autoComplete="off"
                />
                <datalist id="city-options">
                    {cities.map((c) => (
                        <option key={`${c.name}-${Math.random()}`} value={c.name} />
                    ))}
                </datalist>
           </div>
           
           <div className="modern-input-group">
                <label>Zip Code *</label>
                <input className="modern-input" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="Postal Code" />
           </div>
        </div>
        
        <div className="section-block" style={{marginTop:'2rem'}}>
            <h3 className="section-header-modern"><Briefcase className="text-blue-600"/> 3. Contact</h3>
            <div className="form-grid-2">
                <div className="modern-input-group"><label>Email *</label><input className="modern-input" name="email" value={formData.email} onChange={handleChange} /></div>
                <div className="modern-input-group"><label>Mobile *</label><input className="modern-input" name="mobile" value={formData.mobile} onChange={handleChange} /></div>
            </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-fade-in">
      <div className="section-block" style={{marginTop:'2rem'}}>
        <h3 className="section-header-modern"><BookOpen className="text-blue-600"/> Program Selection</h3>
        <div className="form-grid-2">
            <div className="modern-input-group">
                <label>Start Date *</label>
                <input className="modern-input" type="date" name="entryDate" value={formData.entryDate} onChange={handleChange} min={getTomorrowString()} />
            </div>
            <div className="modern-input-group"><label>Payment Type</label><select className="modern-select" name="scholarshipType" value={formData.scholarshipType} onChange={handleChange}><option>Paying (Private)</option><option>Scholarship</option></select></div>
        </div>
        <div className="modern-input-group">
            <label style={{marginBottom:'10px', display:'block'}}>Select Games to Master *</label>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
            {visibleCourseOptions.map((course) => {
                const isSelected = formData.selectedCourses.includes(course.id);
                return (
                <div key={course.id} onClick={() => toggleCourse(course.id)} style={{padding: '1rem', borderRadius: '10px', border: isSelected ? '2px solid #fbbf24' : '1px solid #334155', background: isSelected ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}}>
                    {isSelected ? <CheckSquare size={20} color="#fbbf24"/> : <Square size={20} color="#94a3b8"/>}
                    <span style={{fontWeight: isSelected ? '700' : '400', color: isSelected ? '#fbbf24' : 'var(--text-sub)'}}>{course.name}</span>
                </div>
                )
            })}
            </div>
        </div>
      </div>
      
      <div className="section-block" style={{marginTop:'2rem'}}>
        <h3 className="section-header-modern"><FileText className="text-blue-600"/> Uploads</h3>
        <div className="form-grid-2">
            <div className="modern-input-group">
              <label>ID File</label>
              <div className="upload-zone" onClick={() => idFileRef.current.click()} style={{border: '2px dashed #334155', padding: '1.5rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer'}}>
                {formData.idFile ? <span style={{color:'#fbbf24'}}>{formData.idFile.name}</span> : <span style={{color:'#94a3b8'}}>Upload ID</span>}
              </div>
              <input type="file" name="idFile" ref={idFileRef} onChange={handleFileChange} hidden />
            </div>
            <div className="modern-input-group">
              <label>Birth Certificate</label>
              <div className="upload-zone" onClick={() => birthCertRef.current.click()} style={{border: '2px dashed #334155', padding: '1.5rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer'}}>
                {formData.birthCertFile ? <span style={{color:'#fbbf24'}}>{formData.birthCertFile.name}</span> : <span style={{color:'#94a3b8'}}>Upload Cert</span>}
              </div>
              <input type="file" name="birthCertFile" ref={birthCertRef} onChange={handleFileChange} hidden />
            </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-fade-in" style={{textAlign:'center'}}>
      <h2 style={{fontSize:'2rem', marginBottom:'1rem', color:'var(--text-main)'}}>Review & Submit</h2>
      
      <div style={{background:'var(--bg-soft)', padding:'2rem', borderRadius:'16px', textAlign:'left', maxWidth:'600px', margin:'0 auto', border:'1px solid var(--border)'}}>
        <p style={{color:'var(--text-sub)'}}><strong style={{color:'var(--text-main)'}}>Name:</strong> {formData.firstName} {formData.lastName}</p>
        <p style={{color:'var(--text-sub)'}}><strong style={{color:'var(--text-main)'}}>Email:</strong> {formData.email}</p>
        <p style={{color:'var(--text-sub)'}}><strong style={{color:'var(--text-main)'}}>Location:</strong> {formData.city}, {formData.province}, {formData.country}</p>
        <p style={{color:'var(--text-sub)'}}><strong style={{color:'var(--text-main)'}}>Courses:</strong> {formData.selectedCourses.length} Selected</p>
      </div>
      
      <label style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginTop:'2rem', cursor:'pointer', color:'var(--text-sub)'}}>
        <input type="checkbox" name="privacyConsent" onChange={handleChange} />
        <span>I certify the info is correct and agree to the Data Privacy Act.</span>
      </label>
      
      <button className="btn-primary" onClick={handleSubmit} disabled={!formData.privacyConsent || isSubmitting} style={{marginTop:'2rem', width:'100%', maxWidth:'400px', padding:'1rem'}}>
        {isSubmitting ? 'Submitting...' : 'Submit Application'}
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div style={{textAlign:'center', padding:'4rem 0'}}>
        <CheckCircle size={60} color="#22c55e" style={{margin:'0 auto 1rem'}}/>
        <h2 style={{fontSize:'2rem', color:'var(--text-main)'}}>Application Submitted!</h2>
        
        <div style={{background:'var(--bg-soft)', border:'1px solid var(--border)', padding:'2rem', maxWidth:'400px', margin:'2rem auto', borderRadius:'12px', color:'var(--text-main)'}}>
            <p style={{textTransform:'uppercase', fontSize:'0.8rem', color:'var(--text-sub)'}}>Application ID</p>
            <h3 style={{fontSize:'1.5rem', fontWeight:'bold', color:'var(--text-main)'}}>
                {successData?.id ? `#${successData.id}` : 'Pending'}
            </h3>
            
            <div style={{marginTop:'1.5rem', padding:'10px', background:'rgba(34, 197, 94, 0.1)', borderRadius:'8px', border:'1px solid #22c55e', color: '#15803d'}}>
              <p style={{fontSize:'0.85rem', fontWeight: '600'}}>We will contact you via email shortly.</p>
            </div>
        </div>
    </div>
  );

  return (
    <div className="enroll-page-wrapper">
      {/* ALERT */}
      {alertState.show && (
        <div style={{position:'fixed', top:'20px', right:'20px', zIndex:9999, background: alertState.type==='error'?'#ef4444':'#22c55e', color:'white', padding:'1rem', borderRadius:'8px', boxShadow:'0 10px 20px rgba(0,0,0,0.2)', display:'flex', gap:'10px', alignItems:'center'}}>
          {alertState.type==='error'?<AlertCircle/>:<CheckCircle/>} {alertState.message}
        </div>
      )}

      {/* --- NAVBAR --- */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo-container">
          <Link href="/" className="logo-link">
            <img src="/images/clean-ects.png" alt="Logo" className="logo-image" onError={(e) => e.target.style.display='none'} />
            <div className="logo-text-wrapper">
               <span className="brand-title">Elite Croupier</span>
               <span className="brand-subtitle">Training Services</span>
            </div>
          </Link>
        </div>

        <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/courses" onClick={() => setMobileMenuOpen(false)}>Courses</Link>
          <Link href="/enroll" className="mobile-enroll-btn" onClick={() => setMobileMenuOpen(false)}>Enroll Now</Link>
        </div>

        <div className="nav-actions-container">
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          
          <div className="desktop-only-action">
            <Link href="/enroll"><button className="btn-primary-nav">Enroll Now</button></Link>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* --- FORM CONTAINER --- */}
      <div className="enroll-container" ref={topRef} style={{marginTop:'120px'}}>
        <div className="enroll-card">
          {currentStep < 4 && (
            <div className="wizard-header">
              <div className="progress-pill-container">
                {[1, 2, 3].map(step => (
                  <div key={step} className={`progress-pill ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}></div>
                ))}
              </div>
              <p style={{textAlign:'center', marginTop:'10px', color:'#94a3b8', fontWeight:'600'}}>
                {currentStep === 1 ? 'Student Profile' : currentStep === 2 ? 'Enrollment Details' : 'Review'}
              </p>
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderSuccess()}

            {/* NAVIGATION BUTTONS */}
            {currentStep < 4 && (
              <div style={{display:'flex', justifyContent:'space-between', marginTop:'3rem'}}>
                
                {/* PREVIOUS BUTTON (Only show on Step 2 & 3) */}
                {currentStep > 1 ? (
                    <button type="button" className="btn-ghost" onClick={prevStep}>
                        Previous
                    </button>
                ) : (
                    <div></div> // Empty div to keep alignment
                )}
                
                {/* NEXT BUTTON (Hidden on Step 3 "Review", because Submit is used instead) */}
                {currentStep < 3 && (
                    <button type="button" className="btn-primary" onClick={nextStep}>
                        Next Step <ChevronRight size={18}/>
                    </button>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnrollPage;