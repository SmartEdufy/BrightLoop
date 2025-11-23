
import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/Layout';
import { useNavigate, useLocation } from 'react-router-dom';
import { dateToWords, calculateNEPAge } from '../../utils/admission';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { SchoolProfile } from '../../types';

// --- TYPES ---
export interface AdmissionData {
  id?: string;
  // Step 1
  schoolName: string;
  zone: string;
  district: string;
  state: string;
  udiseCode: string;
  schoolEmail: string;
  schoolManagement?: string; // 'GOVT' | 'PRIVATE'
  schoolRegNo?: string; // For private schools
  session: string;
  admissionDate: string;
  // Step 2
  fullName: string;
  dob: string;
  dobWords: string;
  aadhaar: string;
  category: string; // New Field
  photo?: string; // base64
  // Step 3
  fatherName: string;
  motherName: string;
  guardianOcc: string;
  residence: string;
  // Step 4
  lastSchool: string;
  lastClass: string;
  certNumber: string;
  penNo: string;
  // Step 5
  phone: string;
  bankAccount: string;
  ifsc: string;
  bankName: string;
  // Step 6
  admissionClass: string;
  admissionNo: string;
  
  schoolId: string; // Link to system
  createdAt: string;
}

const INITIAL_DATA: AdmissionData = {
  schoolName: '', zone: '', district: '', state: '', udiseCode: '', schoolEmail: '', session: '', admissionDate: new Date().toISOString().split('T')[0],
  schoolManagement: 'GOVT', schoolRegNo: '',
  fullName: '', dob: '', dobWords: '', aadhaar: '', category: 'OM', photo: '',
  fatherName: '', motherName: '', guardianOcc: '', residence: '',
  lastSchool: '', lastClass: '', certNumber: '', penNo: '',
  phone: '', bankAccount: '', ifsc: '', bankName: '',
  admissionClass: '', admissionNo: '',
  schoolId: '', createdAt: ''
};

const CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
const CATEGORIES = ['OM', 'ST', 'SC', 'OBC', 'RBA', 'Other'];

// --- HELPER FUNCTIONS ---

const getWatermarkName = (name: string) => {
    if (!name) return '';
    const stopWords = ['GOVT', 'GOVERNMENT', 'MIDDLE', 'PRIMARY', 'HIGH', 'HIGHER', 'SECONDARY', 'SENIOR', 'PUBLIC', 'SCHOOL', 'INTERNATIONAL', 'HR', 'SEC', 'BOYS', 'GIRLS'];
    const words = name.split(' ');
    let result = '';
    let currentAbbr = '';
    
    words.forEach(word => {
        const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
        const upper = cleanWord.toUpperCase();
        if (stopWords.includes(upper)) {
            currentAbbr += upper[0];
        } else {
            if (currentAbbr) {
                result += currentAbbr + ' ';
                currentAbbr = '';
            }
            result += word + ' ';
        }
    });
    if (currentAbbr) result += currentAbbr;
    return result.trim() || name;
};


// --- COMPONENTS ---

const FloatingInput = ({ label, error, className, ...props }: any) => (
  <div className="relative group">
    <input
      {...props}
      placeholder=" "
      className={`peer block w-full rounded-xl border-2 bg-white px-4 pt-4 pb-3 text-sm font-bold text-slate-800 placeholder-transparent focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 transition-all shadow-sm ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 group-hover:border-slate-300'} ${className}`}
    />
    <label className={`pointer-events-none absolute left-3 top-0 z-10 origin-[0] -translate-y-1/2 scale-75 transform bg-white px-2 text-[10px] font-bold uppercase tracking-widest duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 ${error ? 'text-red-500' : 'text-slate-400 peer-focus:text-indigo-600'}`}>
      {label}
    </label>
    {error && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-wide ml-1 animate-pulse">{error}</p>}
  </div>
);

const FloatingSelect = ({ label, children, error, ...props }: any) => (
  <div className="relative group">
    <select
      {...props}
      className={`peer block w-full rounded-xl border-2 bg-white px-4 pt-4 pb-3 text-sm font-bold text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 appearance-none transition-all shadow-sm ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 group-hover:border-slate-300'}`}
    >
      {children}
    </select>
    <label className={`pointer-events-none absolute left-3 top-0 z-10 origin-[0] -translate-y-1/2 scale-75 transform bg-white px-2 text-[10px] font-bold uppercase tracking-widest duration-300 ${error ? 'text-red-500' : 'text-slate-400 peer-focus:text-indigo-600'}`}>
      {label}
    </label>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
    {error && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-wide ml-1 animate-pulse">{error}</p>}
  </div>
);

// --- MAIN COMPONENT ---

const Admission: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<AdmissionData>(INITIAL_DATA);
  const [errors, setErrors] = useState<{[key:string]: string}>({});
  const [nepStatus, setNepStatus] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Initialize form data
  useEffect(() => {
    const initData = async () => {
        if (state?.studentData) {
            setFormData(state.studentData);
            return;
        }

        if (userProfile?.schoolId) {
            if (userProfile.schoolId === 'demo-school') {
                 setFormData(prev => ({
                     ...prev,
                     schoolName: 'Green Valley International School',
                     udiseCode: 'UDISE-2024-001',
                     zone: 'Central',
                     district: 'Metro City',
                     state: 'California',
                     schoolEmail: 'info@greenvalley.edu',
                     session: '2025-26',
                     schoolManagement: 'PRIVATE',
                     schoolRegNo: 'REG-998877'
                 }));
            } else {
                try {
                    const docRef = doc(db, 'schools', userProfile.schoolId);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        const schoolData = snap.data() as SchoolProfile;
                        setFormData(prev => ({
                            ...prev,
                            schoolName: schoolData.name || '',
                            udiseCode: schoolData.udiseCode || '',
                            zone: schoolData.zone || '',
                            district: schoolData.district || '',
                            state: schoolData.state || '',
                            schoolEmail: schoolData.websiteConfig?.contactEmail || userProfile.email || '',
                            schoolManagement: schoolData.management || 'GOVT',
                            schoolRegNo: schoolData.regNo || '',
                            session: prev.session || `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`
                        }));
                    }
                } catch (e) {
                    console.error("Could not auto-fill school details", e);
                }
            }
        }
    };
    initData();
  }, [state, userProfile]);

  useEffect(() => {
    const calc = calculateNEPAge(formData.dob, formData.session, formData.admissionClass);
    setNepStatus(calc);
  }, [formData.dob, formData.session, formData.admissionClass]);

  const validateStep = (currentStep: number) => {
    const newErrors: {[key:string]: string} = {};
    let isValid = true;

    const req = (field: keyof AdmissionData, msg: string) => {
      if (!formData[field]) { newErrors[field] = msg; isValid = false; }
    };

    if (currentStep === 1) {
        req('schoolName', 'Required');
        req('session', 'Required');
    }
    if (currentStep === 2) {
        req('fullName', 'Required');
        req('dob', 'Required');
        if(formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar)) { newErrors.aadhaar = "12 Digits"; isValid = false; }
        req('aadhaar', 'Required');
        req('category', 'Required');
    }
    if (currentStep === 3) {
        req('fatherName', 'Required');
        req('motherName', 'Required');
        req('residence', 'Required');
    }
    if (currentStep === 5) {
        req('phone', 'Required');
        if(formData.phone && !/^\d{10}$/.test(formData.phone)) { newErrors.phone = "10 Digits"; isValid = false; }
        
        req('bankAccount', 'Required');
        if(formData.bankAccount && !/^\d{9,18}$/.test(formData.bankAccount)) { newErrors.bankAccount = "Invalid Account No."; isValid = false; }
        
        req('ifsc', 'Required');
        if(formData.ifsc && formData.ifsc.length !== 11) { newErrors.ifsc = "11 Characters"; isValid = false; }
    }
    if (currentStep === 6) {
        req('admissionClass', 'Required');
        req('admissionNo', 'Required');
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
       setStep(s => s + 1);
       window.scrollTo(0,0);
    }
  };

  const handleBack = () => setStep(s => s - 1);

  const handleChange = (field: keyof AdmissionData, value: string) => {
    let val = value;
    if (['fullName', 'fatherName', 'motherName', 'ifsc', 'penNo'].includes(field)) {
        val = val.toUpperCase();
    }
    setFormData(prev => {
        const newData = { ...prev, [field]: val };
        if (field === 'dob') newData.dobWords = dateToWords(val);
        return newData;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result as string }));
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!userProfile?.schoolId) return;
    setSaving(true);

    if (currentUser?.uid === 'demo-user-123') {
        setTimeout(() => {
            setSaving(false);
            alert("Demo Mode: Admission record saved locally.");
            navigate('/dashboard/admission/list');
        }, 1000);
        return;
    }

    try {
        const payload: any = { 
            ...formData, 
            schoolId: userProfile.schoolId, 
            createdAt: formData.createdAt || new Date().toISOString() 
        };
        delete payload.id;

        if (formData.id) {
            await updateDoc(doc(db, 'admission_forms', formData.id), payload);
        } else {
            await addDoc(collection(db, 'admission_forms'), payload);
        }
        navigate('/dashboard/admission/list');
    } catch (error: any) {
        alert(`Failed to save data: ${error.message}`);
    } finally {
        setSaving(false);
    }
  };

  // --- PRINT ENGINE (FULL A4, PREMIUM GRID, COLOR SCHEME) ---
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Pop-up blocked. Please allow pop-ups.");
        return;
    }

    const watermarkText = getWatermarkName(formData.schoolName);
    const val = (v: any) => v || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Admission Form - ${formData.fullName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            :root {
                --green: #68B92E; 
                --blue: #0084C4; 
                --red: #DE4019; 
                --black: #1F1A16; 
                --border-color: #1F1A16;
            }
            @page { 
                size: A4; 
                margin: 0; 
            }
            body { 
                margin: 0; 
                padding: 0; 
                background: white; 
                font-family: 'Inter', sans-serif; 
                color: var(--black);
                font-size: 10pt; 
                line-height: 1.3;
            }
            .page-container {
                width: 210mm;
                height: 296mm;
                padding: 5mm 6mm;
                margin: 0 auto;
                position: relative;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            /* --- WATERMARK --- */
            .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-30deg);
                font-family: 'Playfair Display', serif;
                font-size: 60px; /* Reduced for safe fit */
                font-weight: 900;
                color: var(--green);
                opacity: 0.06;
                text-align: center;
                width: 90%;
                pointer-events: none;
                z-index: 0;
                white-space: normal;
                overflow-wrap: break-word;
                line-height: 1.2;
            }

            /* --- LAYOUT STRUCTURE --- */
            .main-frame {
                flex: 1;
                display: flex;
                flex-direction: column;
                border: 2px solid var(--border-color);
                background: transparent;
                margin-bottom: 6px;
            }

            /* --- PREMIUM HEADER SECTION --- */
            .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
                border-bottom: 3px double var(--red);
                background: white;
                position: relative;
            }
            .logo-section {
                width: 75px;
                height: 75px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                border: 2px solid var(--red);
                border-radius: 12px;
                color: var(--red);
                box-shadow: 3px 3px 0px rgba(222, 64, 25, 0.1);
            }
            .header-text {
                flex: 1;
                text-align: center;
                padding: 0 20px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .school-name {
                font-family: 'Playfair Display', serif;
                font-size: 28px;
                font-weight: 900;
                color: var(--red);
                text-transform: uppercase;
                line-height: 1;
                margin-bottom: 4px;
                letter-spacing: -0.5px;
                white-space: nowrap;
            }
            .sub-heading {
                font-size: 11pt;
                font-weight: 700;
                color: var(--black);
                text-transform: uppercase;
                margin-bottom: 4px;
                letter-spacing: 0.5px;
            }
            .meta-bar {
                display: flex;
                justify-content: center;
                gap: 12px;
                font-size: 8.5pt;
                color: var(--black);
                font-weight: 500;
                flex-wrap: wrap;
                align-items: center;
            }
            .meta-text {
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            .meta-badge {
                background: var(--black);
                color: white;
                padding: 1px 6px;
                border-radius: 3px;
                font-weight: 700;
                font-size: 7pt;
                text-transform: uppercase;
            }
            
            /* --- OFFICE USE STRIP --- */
            .office-use-strip {
                background: var(--red);
                color: white;
                font-size: 11pt;
                font-weight: 800;
                text-align: center;
                padding: 4px;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-bottom: 2px solid var(--border-color);
            }

            /* --- OFFICE GRID --- */
            .office-grid {
                display: grid;
                grid-template-columns: 1fr 1.5fr 0.8fr;
                border-bottom: 2px solid var(--border-color);
            }
            .office-cell {
                padding: 6px 10px;
                border-right: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .office-cell:last-child { border-right: none; }
            .label { font-size: 8pt; font-weight: 800; color: var(--black); text-transform: uppercase; }
            .value { font-size: 10pt; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: var(--blue); }

            /* --- FORM TITLE --- */
            .form-title {
                background: var(--black);
                color: white;
                text-align: center;
                font-size: 13px;
                font-weight: 800;
                padding: 5px;
                text-transform: uppercase;
                letter-spacing: 2px;
                border-bottom: 2px solid var(--border-color);
            }

            /* --- PHOTO & DATA LAYOUT --- */
            .data-container {
                display: flex;
                border-bottom: 2px solid var(--border-color);
                height: 170px;
            }
            .photo-area {
                width: 140px;
                border-left: 2px solid var(--border-color); /* Photo on Right */
                padding: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .photo-box {
                width: 100%;
                height: 100%;
                border: 2px dashed var(--black);
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f4f4f4;
                overflow: hidden;
            }
            .photo-img { width: 100%; height: 100%; object-fit: cover; }
            
            .details-grid {
                flex: 1;
                display: grid;
                grid-template-columns: 1fr 1fr;
            }
            .grid-item {
                padding: 4px 10px;
                border-bottom: 1px solid #aaa;
                border-right: 1px solid #aaa;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .grid-item:nth-child(even) { border-right: none; }
            .grid-item.full { grid-column: span 2; }
            .grid-item:last-child, .grid-item:nth-last-child(2):nth-child(odd) { border-bottom: none; }
            
            .field-label { font-size: 7.5pt; color: #444; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
            .field-val { font-size: 10.5pt; font-weight: 700; color: var(--black); line-height: 1.1; }
            .blue-text { color: var(--blue); }

            /* --- SECTIONS --- */
            .section-header {
                background: var(--blue);
                color: white;
                padding: 4px 10px;
                font-size: 10pt;
                font-weight: 800;
                text-transform: uppercase;
                border-bottom: 1px solid var(--border-color);
                border-top: 1px solid var(--border-color);
                letter-spacing: 0.5px;
            }
            .section-header.first { border-top: none; }

            /* --- COMPACT GRID --- */
            .compact-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                font-size: 10pt;
            }
            .compact-cell {
                padding: 6px 10px;
                border-bottom: 1px solid #bbb;
                border-right: 1px solid #bbb;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .compact-cell:nth-child(4n) { border-right: none; }
            .compact-cell.span-2 { grid-column: span 2; border-right: 1px solid #bbb; }
            .compact-cell.span-4 { grid-column: span 4; border-right: none; }

            /* --- DECLARATION --- */
            .declaration-box {
                padding: 10px 12px;
                font-size: 8.5pt;
                text-align: justify;
                border-bottom: 2px solid var(--border-color);
                flex-grow: 1; /* Pushes content to fill space if needed */
            }
            .decl-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                margin-top: 30px;
                gap: 40px;
            }
            .sig-box {
                border-top: 2px dashed var(--black);
                padding-top: 4px;
                text-align: center;
                font-weight: 700;
                font-size: 9pt;
                white-space: nowrap;
            }

            /* --- OFFICE FOOTER --- */
            .office-footer {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                text-align: center;
                padding: 25px 12px 10px 12px;
                gap: 20px;
            }
            .office-sig {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                height: 50px;
            }
            .office-sig-line {
                width: 100%;
                border-top: 2px dashed var(--black);
                padding-top: 4px;
                font-size: 8pt;
                font-weight: 800;
                text-transform: uppercase;
            }

            /* --- CUT LINE --- */
            .cut-line {
                border-top: 2px dashed #666;
                margin: 4px 0;
                position: relative;
                width: 100%;
            }
            .cut-icon {
                position: absolute;
                top: -12px;
                left: 20px;
                background: white;
                padding: 0 8px;
                font-size: 12px;
                color: #666;
                font-weight: bold;
            }

            /* --- STUDENT COPY --- */
            .student-copy {
                border: 2px solid var(--border-color);
                display: flex;
                flex-direction: column;
                margin-top: auto; /* Ensures it stays at bottom */
            }
            .sc-header {
                background: var(--green);
                color: white;
                text-align: center;
                font-weight: 800;
                padding: 4px;
                font-size: 10pt;
                text-transform: uppercase;
                border-bottom: 1px solid var(--border-color);
            }
            .sc-grid {
                display: grid;
                grid-template-columns: 1.5fr 1fr 1fr;
            }
            .sc-cell {
                padding: 5px 10px;
                border-right: 1px solid #ccc;
                border-bottom: 1px solid #ccc;
            }
            .sc-full {
                grid-column: span 3;
                border-right: none;
                border-bottom: 1px solid #ccc;
                padding: 5px 10px;
            }
            .sc-cell:nth-child(3n) { border-right: none; }
            .sc-cell:last-child { border-right: none; }
            .sc-no-border-b { border-bottom: none; }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="watermark">${watermarkText}</div>
            <div class="main-frame">
                <div class="header">
                    <div class="logo-section"><svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
                    <div class="header-text"><div class="school-name">${formData.schoolName}</div><div class="sub-heading">ZONE: ${val(formData.zone)} | DISTRICT: ${val(formData.district)}</div><div class="meta-bar"><div class="meta-text"><span class="meta-badge">UDISE</span> ${val(formData.udiseCode)}</div>${formData.schoolRegNo ? `<div class="meta-text"><span class="meta-badge">REG</span> ${formData.schoolRegNo}</div>` : ''}<div class="meta-text" style="color:var(--blue); font-weight:700;">✉ ${val(formData.schoolEmail)}</div></div></div>
                    <div style="width:75px;"></div>
                </div>
                <div class="office-use-strip">FOR OFFICE USE ONLY</div>
                <div class="office-grid"><div class="office-cell"><span class="label">Class:</span><span class="value">${val(formData.admissionClass)}</span></div><div class="office-cell"><span class="label">Session:</span><span class="value">${val(formData.session)}</span></div><div class="office-cell"><span class="label">Adm No:</span><span class="value" style="font-size: 12pt; color: var(--red);">${val(formData.admissionNo)}</span></div></div>
                <div class="form-title">ADMISSION APPLICATION FORM</div>
                <div class="data-container">
                    <div class="details-grid">
                         <div class="grid-item full"><span class="field-label">Student Full Name</span><span class="field-val blue-text" style="font-size: 13pt; text-transform:uppercase;">${val(formData.fullName)}</span></div>
                         <div class="grid-item"><span class="field-label">Date of Birth</span><span class="field-val">${val(formData.dob)}</span></div>
                         <div class="grid-item"><span class="field-label">Category</span><span class="field-val">${val(formData.category)}</span></div>
                         <div class="grid-item full"><span class="field-label">DOB in Words</span><span class="field-val" style="font-size: 9pt; text-transform:uppercase;">${val(formData.dobWords)}</span></div>
                         <div class="grid-item"><span class="field-label">Aadhaar No.</span><span class="field-val">${val(formData.aadhaar)}</span></div>
                         <div class="grid-item"><span class="field-label">PEN No.</span><span class="field-val">${val(formData.penNo) || '-'}</span></div>
                    </div>
                    <div class="photo-area"><div class="photo-box">${formData.photo ? `<img src="${formData.photo}" class="photo-img"/>` : '<span style="font-size:9pt;color:#999;text-align:center;font-weight:bold;">PASTE<br>PHOTO</span>'}</div></div>
                </div>
                <div class="section-header first">Guardian Details</div>
                <div class="compact-grid">
                    <div class="compact-cell span-2"><span class="field-label">Father's Name</span><span class="field-val">${val(formData.fatherName)}</span></div>
                    <div class="compact-cell span-2"><span class="field-label">Mother's Name</span><span class="field-val">${val(formData.motherName)}</span></div>
                    <div class="compact-cell span-2"><span class="field-label">Guardian Occupation</span><span class="field-val">${val(formData.guardianOcc)}</span></div>
                     <div class="compact-cell span-2"><span class="field-label">Phone Number</span><span class="field-val">${val(formData.phone)}</span></div>
                    <div class="compact-cell span-4"><span class="field-label">Permanent Residence</span><span class="field-val">${val(formData.residence)}</span></div>
                </div>
                <div class="section-header">Academic & Bank Details</div>
                <div class="compact-grid">
                     <div class="compact-cell span-2"><span class="field-label">Last School Attended</span><span class="field-val">${val(formData.lastSchool)}</span></div>
                     <div class="compact-cell"><span class="field-label">Last Class</span><span class="field-val">${val(formData.lastClass)}</span></div>
                     <div class="compact-cell"><span class="field-label">Cert. No</span><span class="field-val">${val(formData.certNumber)}</span></div>
                     <div class="compact-cell span-2"><span class="field-label">Bank Account No.</span><span class="field-val blue-text" style="letter-spacing:1px;">${val(formData.bankAccount)}</span></div>
                     <div class="compact-cell"><span class="field-label">IFSC Code</span><span class="field-val">${val(formData.ifsc)}</span></div>
                      <div class="compact-cell"><span class="field-label">Bank Name</span><span class="field-val">${val(formData.bankName)}</span></div>
                </div>
                <div class="declaration-box"><span style="font-weight:800; text-transform:uppercase; color:var(--red); display:block; margin-bottom:4px;">Guardian Declaration:</span>I hereby declare that the particulars given above are correct to the best of my knowledge. I agree to abide by the rules and regulations of the school.<div class="decl-grid"><div class="sig-box">Sig. of Student</div><div class="sig-box">Sig. of Parent / Guardian</div></div></div>
                <div class="office-footer">
                    <div class="office-sig"><div class="office-sig-line">UDISE Incharge</div></div>
                    <div class="office-sig"><div class="office-sig-line">Admission Incharge</div></div>
                    <div class="office-sig"><div class="office-sig-line">Headmaster / Principal</div></div>
                </div>
            </div>
            <div class="cut-line"><div class="cut-icon">✂ Student Copy</div></div>
            <div class="student-copy">
                <div class="sc-header">PROVISIONAL ADMISSION RECEIPT - STUDENT COPY</div>
                <div class="sc-grid">
                    <div class="sc-full" style="display:flex; justify-content:space-between; align-items:center;"><span style="font-family:'Playfair Display',serif; font-weight:900; color:var(--red); font-size:12pt; text-transform:uppercase;">${formData.schoolName}</span><span style="font-size:9pt; font-weight:bold;">Session: ${val(formData.session)}</span></div>
                    <div class="sc-cell"><span class="field-label">Name</span><br><span class="field-val">${val(formData.fullName)}</span></div>
                    <div class="sc-cell"><span class="field-label">Class</span><br><span class="field-val">${val(formData.admissionClass)}</span></div>
                    <div class="sc-cell"><span class="field-label">Adm. No</span><br><span class="field-val" style="color:var(--red); font-size:11pt;">${val(formData.admissionNo)}</span></div>
                    <div class="sc-cell sc-no-border-b"><span class="field-label">Parent Name</span><br><span class="field-val">${val(formData.fatherName)}</span></div>
                     <div class="sc-cell sc-no-border-b"><span class="field-label">Date</span><br><span class="field-val">${val(formData.admissionDate)}</span></div>
                     <div class="sc-cell sc-no-border-b" style="display:flex; align-items:end; justify-content:center;"><span style="font-size:8pt; font-weight:700; text-transform:uppercase; color:var(--green);">[ Provisional Stamp ]</span></div>
                </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- RENDER STEP CONTENT ---
  // ... same render logic ...
  return (
    <DashboardLayout>
      {/* Form Layout from existing Admission.tsx */}
      {/* This part is omitted in XML as it remains largely same, only handlePrint updated above */}
      <div className="max-w-3xl mx-auto pb-20">
        {/* Form Steps */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 font-display">New Admission</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Step {step} of 6</p>
                </div>
                {step > 1 && (
                    <button onClick={handleBack} className="text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors">Back</button>
                )}
            </div>

            <div className="p-8">
                {step === 1 && (
                    <div className="space-y-5 animate-fade-in-down">
                        <h3 className="text-lg font-bold text-indigo-900 mb-4 border-b pb-2 border-indigo-50">School & Session Details</h3>
                        <FloatingInput label="School Name" value={formData.schoolName} onChange={(e:any) => handleChange('schoolName', e.target.value)} error={errors.schoolName} />
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingInput label="Session" value={formData.session} onChange={(e:any) => handleChange('session', e.target.value)} error={errors.session} placeholder="2025-26" />
                            <FloatingInput label="Admission Date" type="date" value={formData.admissionDate} onChange={(e:any) => handleChange('admissionDate', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingInput label="UDISE Code" value={formData.udiseCode} onChange={(e:any) => handleChange('udiseCode', e.target.value)} />
                            <FloatingInput label="Email" value={formData.schoolEmail} onChange={(e:any) => handleChange('schoolEmail', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingInput label="Zone" value={formData.zone} onChange={(e:any) => handleChange('zone', e.target.value)} />
                            <FloatingInput label="District" value={formData.district} onChange={(e:any) => handleChange('district', e.target.value)} />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5 animate-fade-in-down">
                        <h3 className="text-lg font-bold text-indigo-900 mb-4 border-b pb-2 border-indigo-50">Student Profile</h3>
                        <FloatingInput label="Full Name" value={formData.fullName} onChange={(e:any) => handleChange('fullName', e.target.value)} error={errors.fullName} />
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingInput label="Date of Birth" type="date" value={formData.dob} onChange={(e:any) => handleChange('dob', e.target.value)} error={errors.dob} />
                            <FloatingSelect label="Category" value={formData.category} onChange={(e:any) => handleChange('category', e.target.value)} error={errors.category}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </FloatingSelect>
                        </div>
                        <FloatingInput label="DOB in Words" value={formData.dobWords} readOnly className="bg-slate-50 text-slate-500" />
                        <FloatingInput label="Aadhaar Number" value={formData.aadhaar} onChange={(e:any) => handleChange('aadhaar', e.target.value)} maxLength={12} error={errors.aadhaar} />
                        
                        {nepStatus && (
                            <div className={`p-3 rounded-xl text-xs font-bold border ${nepStatus.isEligible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                Age as of Class 10: {nepStatus.ageYears} Years, {nepStatus.ageMonths} Months. {nepStatus.isEligible ? 'Eligible per NEP criteria.' : 'Review age criteria.'}
                            </div>
                        )}

                        <div className="mt-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Student Photo</label>
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all" />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-5 animate-fade-in-down">
                        <h3 className="text-lg font-bold text-indigo-900 mb-4 border-b pb-2 border-indigo-50">Guardian Details</h3>
                        <FloatingInput label="Father's Name" value={formData.fatherName} onChange={(e:any) => handleChange('fatherName', e.target.value)} error={errors.fatherName} />
                        <FloatingInput label="Mother's Name" value={formData.motherName} onChange={(e:any) => handleChange('motherName', e.target.value)} error={errors.motherName} />
                        <FloatingInput label="Guardian Occupation" value={formData.guardianOcc} onChange={(e:any) => handleChange('guardianOcc', e.target.value)} error={errors.guardianOcc} />
                        <FloatingInput label="Permanent Residence" value={formData.residence} onChange={(e:any) => handleChange('residence', e.target.value)} error={errors.residence} />
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-5 animate-fade-in-down">
                        <h3 className="text-lg font-bold text-indigo-900 mb-4 border-b pb-2 border-indigo-50">Academic History</h3>
                        <FloatingInput label="Last School Attended" value={formData.lastSchool} onChange={(e:any) => handleChange('lastSchool', e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingInput label="Last Class" value={formData.lastClass} onChange={(e:any) => handleChange('lastClass', e.target.value)} />
                            <FloatingInput label="Transfer Cert. No" value={formData.certNumber} onChange={(e:any) => handleChange('certNumber', e.target.value)} />
                        </div>
                        <FloatingInput label="PEN Number (UDISE+)" value={formData.penNo} onChange={(e:any) => handleChange('penNo', e.target.value)} />
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-5 animate-fade-in-down">
                        <h3 className="text-lg font-bold text-indigo-900 mb-4 border-b pb-2 border-indigo-50">Contact & Bank</h3>
                        <FloatingInput label="Mobile Number" value={formData.phone} onChange={(e:any) => handleChange('phone', e.target.value)} maxLength={10} error={errors.phone} />
                        <FloatingInput label="Bank Account No." value={formData.bankAccount} onChange={(e:any) => handleChange('bankAccount', e.target.value)} error={errors.bankAccount} />
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingInput label="IFSC Code" value={formData.ifsc} onChange={(e:any) => handleChange('ifsc', e.target.value)} maxLength={11} error={errors.ifsc} />
                            <FloatingInput label="Bank Name" value={formData.bankName} onChange={(e:any) => handleChange('bankName', e.target.value)} />
                        </div>
                    </div>
                )}

                {step === 6 && (
                    <div className="space-y-5 animate-fade-in-down">
                        <h3 className="text-lg font-bold text-indigo-900 mb-4 border-b pb-2 border-indigo-50">Admission Allocation</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingSelect label="Admission Class" value={formData.admissionClass} onChange={(e:any) => handleChange('admissionClass', e.target.value)} error={errors.admissionClass}>
                                <option value="">Select</option>
                                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </FloatingSelect>
                            <FloatingInput label="Admission No." value={formData.admissionNo} onChange={(e:any) => handleChange('admissionNo', e.target.value)} error={errors.admissionNo} />
                        </div>
                        
                        <div className="mt-8 bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                            <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Ready to Submit?</p>
                            <p className="text-sm text-indigo-700 mb-4">Please review all details carefully before finalizing the admission.</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={handlePrint} className="px-6 py-2 bg-white text-indigo-700 font-bold text-sm rounded-lg border border-indigo-200 hover:bg-indigo-50 shadow-sm">Preview Form</button>
                                <button onClick={handleSubmit} disabled={saving} className="px-8 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">{saving ? 'Saving...' : 'Confirm Admission'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Footer */}
                {step < 6 && (
                    <div className="pt-8 mt-4 flex justify-end">
                        <button onClick={handleNext} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                            Next Step <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Admission;
