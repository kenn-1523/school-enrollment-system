'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  User, BookOpen, FileText, MapPin, 
  CheckCircle, AlertCircle, Briefcase, 
  CheckSquare, Square, ChevronRight
} from 'lucide-react';

// --- GLOBAL ADDRESS LIBRARY ---
import { Country, State, City } from 'country-state-city';

// --- LAYERS ---
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/footer';
import { useTheme } from '../../context/ThemeContext';
import { coursesData, PH_REGIONS } from '@repo/business-logic';      // ✅ Single Source of Truth
import { calculateTuition } from '../../utils/priceCalculator'; // ✅ Logic Layer
import { submitEnrollment } from '../../services/enrollmentService'; // ✅ Service Layer

import '../../styles/marketing.css';

const EnrollForm = () => {
  // --- STATE ---
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null); 
  const [alertState, setAlertState] = useState({ show: false, message: '', type: 'error' });

  // --- ADDRESS STATE ---
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);     
  const [cities, setCities] = useState([]);     
  const [phProvinceOptions, setPhProvinceOptions] = useState([]);
  const [selectedCountryISO, setSelectedCountryISO] = useState('');

  const idFileRef = useRef(null);
  const birthCertRef = useRef(null); 
  const topRef = useRef(null);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    email: '', mobile: '',
    entryDate: '', scholarshipType: 'Paying',
    selectedCourses: [], // Stores CODES (e.g. 'G1', 'G2')
    lastName: '', firstName: '', middleName: '',
    street: '', city: '', province: '', region: '', country: '', zipCode: '',
    sex: 'Male', civilStatus: 'Single', dob: '', 
    educationLevel: '', employmentStatus: 'Unemployed', 
    privacyConsent: false,
    idFile: null, 
    birthCertFile: null 
  });

  // FREE BUNDLE LOGIC
  const FREE_BUNDLE_CODES = ['F1', 'C1', 'C2']; 

  // --- INIT ---
  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    setCountries(Country.getAllCountries());

    // Handle URL Params from Courses Page
    const urlCodes = searchParams.get('code');
    if (urlCodes) {
        const codesArray = urlCodes.split(',');
        const validCodes = codesArray.filter(code => coursesData.find(c => c.code === code && c.isPaid));
        if (validCodes.length > 0) setFormData(prev => ({ ...prev, selectedCourses: validCodes }));
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [searchParams]);

  // --- REAL-TIME CALCULATION ---
  // This runs on every render to ensure totals are always accurate
  const totals = calculateTuition(formData.selectedCourses);

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

  const toggleCourse = (code) => {
    let updated = [...formData.selectedCourses];
    if (updated.includes(code)) updated = updated.filter(c => c !== code);
    else updated.push(code);
    setFormData({ ...formData, selectedCourses: updated });
  };

  // --- ADDRESS HANDLERS ---
  const handleCountryChange = (e) => {
      const countryName = e.target.value;
      const countryObj = countries.find(c => c.name === countryName);
      const isoCode = countryObj ? countryObj.isoCode : '';
      
      setSelectedCountryISO(isoCode);
      setFormData(prev => ({ ...prev, country: countryName, region: '', province: '', city: '' }));

      if (countryName === "Philippines") {
          setStates([]); setCities([]); setPhProvinceOptions([]);
      } else if (isoCode) {
          setStates(State.getStatesOfCountry(isoCode));
          setCities([]);
      }
  };

  const handlePhRegionChange = (e) => {
      const region = e.target.value;
      setPhProvinceOptions(PH_REGIONS[region] || []);
      setFormData(prev => ({ ...prev, region: region, province: '', city: '' })); 
  };

  const handlePhProvinceChange = (e) => {
      const prov = e.target.value;
      setFormData(prev => ({ ...prev, province: prov, city: '' }));
  };

  const handleIntlStateChange = (e) => {
      const stateName = e.target.value;
      const stateObj = states.find(s => s.name === stateName);
      const stateIso = stateObj ? stateObj.isoCode : '';
      if (stateIso && selectedCountryISO) setCities(City.getCitiesOfState(selectedCountryISO, stateIso)); 
      setFormData(prev => ({ ...prev, region: stateName, province: stateName, city: '' }));
  };

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
    if (step === 1) {
        if (!formData.firstName || !formData.lastName || !formData.dob) { showAlert('Please fill in Name and Birth Date.'); return false; }
        if (!formData.email || !formData.mobile) { showAlert('Contact details required.'); return false; }
        if (!formData.country || !formData.region || !formData.city) { showAlert('Complete address required.'); return false; }
        return true;
    }
    if (step === 2) {
        if (!formData.entryDate) { showAlert('Select Start Date.'); return false; }
        if (formData.selectedCourses.length === 0) { showAlert('Select at least one course.'); return false; }
        return true;
    }
    return true;
  };

  const nextStep = () => { if (validateStep(currentStep)) { window.scrollTo(0,0); setCurrentStep(prev => Math.min(prev + 1, 3)); }};
  const prevStep = () => { window.scrollTo(0,0); setCurrentStep(prev => Math.max(prev - 1, 1)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalCourses = [...new Set([...formData.selectedCourses, ...FREE_BUNDLE_CODES])];
    const submissionData = { ...formData, selectedCourses: finalCourses };

    try {
      const data = await submitEnrollment(submissionData, idFileRef.current?.files[0], birthCertRef.current?.files[0]);
      setSuccessData({ id: data.id || 'Pending' });
      window.scrollTo(0,0);
      setCurrentStep(4);
    } catch (err) {
      showAlert(err.message || 'Submission Failed'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER STEPS ---
  
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
        <div className="form-grid-2">
            <div className="modern-input-group">
                <label>Education Level *</label>
                <select className="modern-select" name="educationLevel" value={formData.educationLevel} onChange={handleChange}>
                    <option value="" disabled>Select Level</option>
                    <option value="High School">High School</option>
                    <option value="College Graduate">College Graduate</option>
                    <option value="Vocational">Vocational</option>
                </select>
            </div>
            <div className="modern-input-group"><label>Employment Status *</label><select className="modern-select" name="employmentStatus" value={formData.employmentStatus} onChange={handleChange}><option value="Unemployed">Unemployed</option><option value="Employed">Employed</option><option value="Student">Student</option></select></div>
        </div>
      </div>

      <div className="section-block" style={{marginTop:'2rem'}}>
        <h3 className="section-header-modern"><MapPin className="text-blue-600"/> 2. Address</h3>
        <div className="form-grid-2">
           <div className="modern-input-group">
              <label>Country *</label>
              <input list="country-options" className="modern-input" value={formData.country} onChange={handleCountryChange} placeholder="Search country..." />
              <datalist id="country-options">{countries.map((c) => (<option key={c.isoCode} value={c.name} />))}</datalist>
           </div>
           <div className="modern-input-group">
                <label>{formData.country === 'Philippines' ? 'Region *' : 'State / Province *'}</label>
                {formData.country === 'Philippines' ? (
                    <><input list="ph-region-options" className="modern-input" value={formData.region} onChange={handlePhRegionChange} /><datalist id="ph-region-options">{Object.keys(PH_REGIONS).map((reg) => (<option key={reg} value={reg} />))}</datalist></>
                ) : (
                    <><input list="intl-state-options" className="modern-input" value={formData.region} onChange={handleIntlStateChange} /><datalist id="intl-state-options">{states.map((s) => (<option key={s.isoCode} value={s.name} />))}</datalist></>
                )}
           </div>
        </div>
        <div className="form-grid-2">
           {formData.country === 'Philippines' && (
               <div className="modern-input-group"><label>Province *</label><input list="ph-province-options" className="modern-input" value={formData.province} onChange={handlePhProvinceChange} /><datalist id="ph-province-options">{phProvinceOptions.map((prov) => (<option key={prov} value={prov} />))}</datalist></div>
           )}
           <div className="modern-input-group"><label>City *</label><input list="city-options" className="modern-input" value={formData.city} onChange={handleCityChange} /><datalist id="city-options">{cities.map((c) => (<option key={`${c.name}-${Math.random()}`} value={c.name} />))}</datalist></div>
           <div className="modern-input-group"><label>Zip Code *</label><input className="modern-input" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="Postal Code" /></div>
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

  const renderStep2 = () => {
    // ✅ Use Data Layer
    const paidCourses = coursesData.filter(c => c.isPaid);

    return (
    <div className="animate-fade-in">
      <div className="section-block" style={{marginTop:'2rem'}}>
        <h3 className="section-header-modern"><BookOpen className="text-blue-600"/> Program Selection</h3>
        
        <div className="form-grid-2">
            <div className="modern-input-group"><label>Start Date *</label><input className="modern-input" type="date" name="entryDate" value={formData.entryDate} onChange={handleChange} min={getTomorrowString()} /></div>
            <div className="modern-input-group"><label>Payment Type</label><select className="modern-select" name="scholarshipType" value={formData.scholarshipType} onChange={handleChange}><option>Paying (Private)</option><option>Scholarship</option></select></div>
        </div>

        {/* ✅ TWO-COLUMN LAYOUT: Courses (Left) + Real-Time Calculation (Right) */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginTop:'2rem', alignItems:'start'}}>
          
          {/* LEFT: COURSE SELECTION */}
          <div>
            <label style={{marginBottom:'10px', display:'block', color:'#94a3b8', fontWeight:'600', fontSize:'1rem'}}>Select Games to Master *</label>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {paidCourses.map((course) => {
                    const isSelected = formData.selectedCourses.includes(course.code);
                    return (
                        <div 
                            key={course.code} 
                            onClick={() => toggleCourse(course.code)} 
                            style={{
                                padding: '1rem', 
                                borderRadius: '10px', 
                                border: isSelected ? '2px solid #fbbf24' : '1px solid #334155', 
                                background: isSelected ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-soft)', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '15px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {isSelected ? <CheckSquare size={24} color="#fbbf24"/> : <Square size={24} color="#94a3b8"/>}
                            <span style={{
                                fontWeight: isSelected ? '700' : '400', 
                                color: isSelected ? '#fbbf24' : 'var(--text-sub)',
                                fontSize: '1rem'
                            }}>
                                {course.title}
                            </span>
                        </div>
                    )
                })}
            </div>
          </div>

          {/* RIGHT: REAL-TIME CALCULATION (STICKY) */}
          <div style={{position:'sticky', top:'100px'}}>
            {formData.selectedCourses.length === 0 ? (
              <div style={{background:'rgba(251, 191, 36, 0.08)', border:'2px dashed #fbbf24', borderRadius:'12px', padding:'2rem', textAlign:'center', color:'#94a3b8'}}>
                <p style={{fontSize:'1rem', margin:'0'}}>Select courses to see pricing</p>
              </div>
            ) : (
              <div style={{background:'rgba(251, 191, 36, 0.08)', border:'2px solid #fbbf24', borderRadius:'12px', padding:'1.5rem'}}>
                <h4 style={{color:'#fbbf24', fontSize:'1.1rem', marginBottom:'15px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 15px 0'}}>💰 Price Breakdown</h4>
                
                {/* Course List */}
                <div style={{marginBottom:'15px', paddingBottom:'15px', borderBottom:'1px dashed #fbbf24'}}>
                  {totals.selectedObjects.map(c => (
                    <div key={c.code} style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', color:'var(--text-sub)', fontSize:'0.95rem'}}>
                      <span>{c.title}</span>
                      <span style={{color:'#fbbf24', fontWeight:'bold'}}>${c.price}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown */}
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', color:'var(--text-sub)', fontSize:'0.95rem'}}>
                  <span>Subtotal</span>
                  <span style={{color:'var(--text-main)', fontWeight:'bold'}}>${totals.subtotal.toLocaleString()}</span>
                </div>

                {totals.discountPercent > 0 && (
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px', paddingBottom:'12px', borderBottom:'1px dashed #10b981', color:'#10b981', fontSize:'0.95rem'}}>
                    <span>Discount ({Math.round(totals.discountPercent * 100)}%)</span>
                    <span style={{fontWeight:'bold'}}>-${totals.discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'10px', borderTop:'1px solid #fbbf24'}}>
                  <span style={{color:'white', fontSize:'1rem', fontWeight:'bold'}}>Total Due</span>
                  <span style={{color:'#fbbf24', fontSize:'1.3rem', fontWeight:'bold'}}>${totals.finalTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* ✅ RESTORED: Dashed Upload Boxes from Screenshot */}
      <div className="section-block" style={{marginTop:'2rem'}}>
        <h3 className="section-header-modern"><FileText className="text-blue-600"/> Uploads</h3>
        <div className="form-grid-2">
            
            <div className="modern-input-group">
              <label>ID File</label>
              <div 
                  className="upload-zone" 
                  onClick={() => idFileRef.current.click()} 
                  style={{
                      border: '2px dashed #334155', 
                      padding: '2rem 1rem', 
                      textAlign: 'center', 
                      borderRadius: '12px', 
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)'
                  }}
              >
                {formData.idFile ? (
                    <span style={{color:'#fbbf24', fontWeight:'bold'}}>{formData.idFile.name}</span>
                ) : (
                    <span style={{color:'#94a3b8'}}>Upload ID</span>
                )}
              </div>
              <input type="file" name="idFile" ref={idFileRef} onChange={handleFileChange} hidden />
            </div>

            <div className="modern-input-group">
              <label>Birth Certificate</label>
              <div 
                  className="upload-zone" 
                  onClick={() => birthCertRef.current.click()} 
                  style={{
                      border: '2px dashed #334155', 
                      padding: '2rem 1rem', 
                      textAlign: 'center', 
                      borderRadius: '12px', 
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)'
                  }}
              >
                {formData.birthCertFile ? (
                    <span style={{color:'#fbbf24', fontWeight:'bold'}}>{formData.birthCertFile.name}</span>
                ) : (
                    <span style={{color:'#94a3b8'}}>Upload Cert</span>
                )}
              </div>
              <input type="file" name="birthCertFile" ref={birthCertRef} onChange={handleFileChange} hidden />
            </div>

        </div>
      </div>
    </div>
  )};

  const renderStep3 = () => (
    <div className="animate-fade-in" style={{textAlign:'center'}}>
      <h2 style={{fontSize:'2rem', marginBottom:'1rem', color:'var(--text-main)'}}>Review & Submit</h2>
      <div style={{background:'var(--bg-soft)', padding:'2rem', borderRadius:'16px', textAlign:'left', maxWidth:'600px', margin:'0 auto', border:'1px solid var(--border)'}}>
        {/* PERSONAL DETAILS */}
        <div style={{marginBottom:'20px'}}>
          <h4 style={{color:'var(--text-main)', fontSize:'1.1rem', marginBottom:'10px'}}>Personal Details</h4>
          <p style={{color:'var(--text-sub)', marginBottom:'5px'}}><strong style={{color:'var(--text-main)'}}>Name:</strong> {formData.firstName} {formData.lastName}</p>
          <p style={{color:'var(--text-sub)'}}><strong style={{color:'var(--text-main)'}}>Location:</strong> {formData.city}, {formData.province || formData.region}, {formData.country}</p>
        </div>

        {/* ENROLLMENT DETAILS */}
        <div style={{marginBottom:'20px', paddingBottom:'20px', borderBottom:'1px solid var(--border)'}}>
          <h4 style={{color:'var(--text-main)', fontSize:'1.1rem', marginBottom:'10px'}}>Enrollment Details</h4>
          <p style={{color:'var(--text-sub)', marginBottom:'5px'}}><strong style={{color:'var(--text-main)'}}>Start Date:</strong> {formData.entryDate}</p>
          <p style={{color:'var(--text-sub)'}}><strong style={{color:'var(--text-main)'}}>Payment Type:</strong> {formData.scholarshipType}</p>
        </div>

        {/* AUTOMATIC CALCULATION DISPLAY */}
        <div style={{marginTop:'20px', paddingTop:'20px', borderTop:'2px solid #fbbf24'}}>
          <h4 style={{color:'#fbbf24', fontSize:'1.2rem', marginBottom:'15px', textTransform:'uppercase', letterSpacing:'1px'}}>💰 Automatic Tuition Calculation</h4>
          
          {/* SELECTED COURSES BREAKDOWN */}
          <div style={{marginBottom:'15px', background:'rgba(251, 191, 36, 0.05)', padding:'15px', borderRadius:'8px'}}>
            <p style={{color:'var(--text-sub)', marginBottom:'10px', fontWeight:'600'}}>Selected Courses:</p>
            {totals.selectedObjects.length === 0 ? (
              <p style={{color:'#ef4444', fontSize:'0.9rem'}}>No paid courses selected</p>
            ) : (
              <ul style={{listStyle:'none', paddingLeft:'0', margin:'0'}}>
                {totals.selectedObjects.map(c => (
                    <li key={c.code} style={{marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'8px', borderBottom:'1px solid rgba(251, 191, 36, 0.2)'}}>
                      <span style={{color:'var(--text-sub)'}}>{c.title}</span>
                      <span style={{color:'#fbbf24', fontWeight:'bold'}}>${c.price}</span>
                    </li>
                ))}
              </ul>
            )}
          </div>

          {/* PRICING SUMMARY */}
          <div style={{background:'rgba(251, 191, 36, 0.1)', padding:'15px', borderRadius:'8px', border:'1px solid #fbbf24'}}>
            <div style={{marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'10px', borderBottom:'1px dashed #fbbf24'}}>
              <span style={{color:'var(--text-sub)'}}>Subtotal ({totals.paidCount} course{totals.paidCount !== 1 ? 's' : ''})</span>
              <span style={{color:'var(--text-main)', fontWeight:'bold'}}>${totals.subtotal.toLocaleString()}</span>
            </div>

            {totals.discountPercent > 0 && (
              <div style={{marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'10px', borderBottom:'1px dashed #10b981', color:'#10b981'}}>
                <span>Volume Discount ({Math.round(totals.discountPercent * 100)}%)</span>
                <span style={{fontWeight:'bold'}}>-${totals.discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'15px'}}>
              <span style={{color:'white', fontSize:'1.1rem', fontWeight:'bold'}}>Total Tuition Due</span>
              <span style={{color:'#fbbf24', fontSize:'1.5rem', fontWeight:'bold'}}>${totals.finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PRIVACY CONSENT */}
      <label style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginTop:'2rem', cursor:'pointer', color:'var(--text-sub)'}}>
        <input type="checkbox" name="privacyConsent" onChange={handleChange} style={{width:'18px', height:'18px', accentColor:'#fbbf24'}} />
        <span>I certify the info is correct and agree to the Data Privacy Act.</span>
      </label>
      
      {/* SUBMIT BUTTON */}
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
            <h3 style={{fontSize:'1.5rem', fontWeight:'bold', color:'var(--text-main)'}}>{successData?.id ? `#${successData.id}` : 'Pending'}</h3>
        </div>
    </div>
  );

  return (
    <div className="enroll-page-wrapper">
      <Navbar />
      {alertState.show && (
        <div style={{position:'fixed', top:'100px', right:'20px', zIndex:9999, background: alertState.type==='error'?'#ef4444':'#22c55e', color:'white', padding:'1rem', borderRadius:'8px', display:'flex', gap:'10px', alignItems:'center'}}>
          {alertState.type==='error'?<AlertCircle/>:<CheckCircle/>} {alertState.message}
        </div>
      )}
      
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

            {currentStep < 4 && (
              <div style={{display:'flex', justifyContent:'space-between', marginTop:'3rem'}}>
                {currentStep > 1 ? <button type="button" className="btn-ghost" onClick={prevStep}>Previous</button> : <div></div>}
                {currentStep < 3 && <button type="button" className="btn-primary" onClick={nextStep}>Next Step <ChevronRight size={18}/></button>}
              </div>
            )}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default function EnrollPage() {
    return <Suspense fallback={<div>Loading...</div>}><EnrollForm /></Suspense>;
}