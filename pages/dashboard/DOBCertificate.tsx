
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { SchoolProfile, Student } from '../../types';
import { dateToWords } from '../../utils/admission';

// --- TYPES ---
interface CertFormData {
  studentName: string;
  fatherName: string;
  motherName: string;
  gender: 'Male' | 'Female';
  dob: string;
  class: string;
  rollNo: string;
  address: string;
  admissionNo: string;
  refNo: string; // New field
  issueDate: string;
  status: 'is reading' | 'was reading' | 'passed';
  session: string;
}

const DOBCertificate: React.FC = () => {
  const { userProfile } = useAuth();
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [includeMotherName, setIncludeMotherName] = useState(true);
  
  const [formData, setFormData] = useState<CertFormData>({
    studentName: '',
    fatherName: '',
    motherName: '',
    gender: 'Male',
    dob: '',
    class: '',
    rollNo: '',
    address: '',
    admissionNo: '',
    refNo: '',
    issueDate: new Date().toISOString().split('T')[0],
    status: 'is reading',
    session: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`
  });

  useEffect(() => {
    if (userProfile?.schoolId) {
      fetchSchoolProfile();
      fetchStudents();
    }
  }, [userProfile?.schoolId]);

  const fetchSchoolProfile = async () => {
    if (!userProfile?.schoolId) return;
    if (userProfile.schoolId === 'demo-school') {
        setSchool({
            id: 'demo', name: 'Green Valley International School', udiseCode: 'UDISE-2025',
            zone: 'Central', district: 'Metro City', state: 'California',
            type: 'High School' as any, headmasterName: 'Dr. Smith',
            address: '123 Education Lane, Metro City', ownerUid: 'demo', slug: 'demo',
            websiteConfig: { logoUrl: '' } as any,
            watermarkText: 'G.V.I.S'
        });
        return;
    }
    const docSnap = await getDoc(doc(db, 'schools', userProfile.schoolId));
    if (docSnap.exists()) setSchool(docSnap.data() as SchoolProfile);
  };

  const fetchStudents = async () => {
    if (!userProfile?.schoolId || userProfile.schoolId === 'demo-school') return;
    try {
        const q = query(collection(db, 'students'), where('schoolId', '==', userProfile.schoolId));
        const snap = await getDocs(q);
        setStudents(snap.docs.map(d => d.data() as Student));
    } catch(e) { console.error(e); }
  };

  const handleSelectStudent = (student: Student) => {
      setFormData(prev => ({
          ...prev,
          studentName: student.name.toUpperCase(),
          fatherName: student.fatherName.toUpperCase(),
          gender: student.gender === 'Male' ? 'Male' : 'Female',
          dob: student.dob,
          class: student.class,
          rollNo: student.rollNo,
          address: student.address,
          admissionNo: student.admissionNo || ''
      }));
      setShowDropdown(false);
      setSearchTerm('');
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Derived values for preview and print
  const issueParts = formData.issueDate.split('-');
  const issueFormatted = issueParts.length === 3 ? `${issueParts[2]}/${issueParts[1]}/${issueParts[0]}` : formData.issueDate;
  const dobParts = formData.dob.split('-');
  const dobFormatted = dobParts.length === 3 ? `${dobParts[2]}/${dobParts[1]}/${dobParts[0]}` : formData.dob;
  const dobWords = formData.dob ? dateToWords(formData.dob) : '';

  const handlePrint = () => {
    if (!school) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const relation = formData.gender === 'Female' ? 'Daughter of' : 'Son of';
    const hisHer = formData.gender === 'Female' ? 'Her' : 'His';
    const watermarkText = school.watermarkText || school.name;

    // Calculate dynamic font size for school name to fit on one line
    const nameLen = school.name.length;
    // Base size 32px for ~25 chars. Reduce by 0.7px for each extra char, min 16px.
    const titleFontSize = nameLen > 25 ? Math.max(16, 32 - (nameLen - 25) * 0.7) : 32;

    // Logic for Parent Text
    const parentText = includeMotherName 
        ? `<span class="highlight">${formData.fatherName}</span> and <span class="highlight">${formData.motherName}</span>`
        : `<span class="highlight">${formData.fatherName}</span>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DOB Certificate - ${formData.studentName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
        <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; color: #1f1a16; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page-container { width: 210mm; height: 296mm; padding: 10mm; margin: 0 auto; box-sizing: border-box; position: relative; }
            .border-frame { border: 2px solid #1f1a16; height: 100%; padding: 5px; box-sizing: border-box; display: flex; flex-direction: column; }
            .inner-border { border: 1px solid #1f1a16; height: 100%; padding: 30px 40px; box-sizing: border-box; position: relative; display: flex; flex-direction: column; }
            
            /* Watermark */
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-family: 'Playfair Display', serif; font-size: 60px; font-weight: 900; color: #1f1a16; opacity: 0.04; text-align: center; width: 80%; pointer-events: none; z-index: 0; line-height: 1.2; white-space: normal; overflow-wrap: break-word; }

            /* Header */
            .header { text-align: center; margin-bottom: 20px; position: relative; z-index: 1; width: 100%; overflow: hidden; }
            .logo-img { height: 80px; width: auto; margin-bottom: 10px; }
            .school-name { 
                font-family: 'Playfair Display', serif; 
                font-size: ${titleFontSize}px; 
                font-weight: 900; 
                text-transform: uppercase; 
                color: #be123c; 
                line-height: 1.1; 
                margin-bottom: 8px; 
                letter-spacing: -0.5px;
                white-space: nowrap; /* Force single line */
                overflow: hidden;
                text-overflow: clip; /* Avoid ellipsis in print if possible, just clip if extreme */
                width: 100%;
                display: block;
            }
            .school-address { font-size: 11pt; font-weight: 600; text-transform: uppercase; color: #444; margin-bottom: 4px; }
            .school-meta { font-size: 9pt; font-weight: 500; color: #666; }

            /* Ref & Date Row */
            .ref-row { display: flex; justify-content: space-between; margin: 20px 0 10px 0; font-weight: 700; font-size: 11pt; border-bottom: 1px dashed #ddd; padding-bottom: 10px; }

            /* Title */
            .cert-title { text-align: center; margin: 30px 0 40px 0; position: relative; z-index: 1; }
            .title-text { font-family: 'Playfair Display', serif; font-size: 22pt; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #1f1a16; padding-bottom: 5px; display: inline-block; letter-spacing: 1px; }

            /* Content */
            .content { font-size: 14pt; line-height: 2; text-align: justify; margin-bottom: auto; position: relative; z-index: 1; }
            .highlight { font-weight: 700; font-family: 'Playfair Display', serif; font-size: 15pt; color: #1f1a16; text-transform: uppercase; border-bottom: 1px dotted #999; padding: 0 5px; }
            .small-highlight { font-weight: 700; font-family: 'Inter', sans-serif; font-size: 13pt; border-bottom: 1px dotted #999; padding: 0 5px; }

            /* Footer */
            .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; padding-bottom: 20px; }
            .sig-block { text-align: center; width: 200px; }
            .sig-line { border-top: 1px solid #1f1a16; padding-top: 8px; font-weight: 700; font-size: 10pt; text-transform: uppercase; }
            
            /* Specific Data Box */
            .dob-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; margin: 30px 0; border-radius: 8px; }
            .dob-row { display: flex; margin-bottom: 8px; font-size: 12pt; }
            .dob-row:last-child { margin-bottom: 0; }
            .dob-label { width: 140px; font-weight: 600; color: #555; flex-shrink: 0; }
            .dob-val { font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #1f1a16; }

        </style>
      </head>
      <body>
        <div class="page-container">
            <div class="border-frame">
                <div class="inner-border">
                    <div class="watermark">${watermarkText}</div>
                    
                    <div class="header">
                        ${school.websiteConfig?.logoUrl ? `<img src="${school.websiteConfig.logoUrl}" class="logo-img" />` : `<div style="font-size:40px; margin-bottom:10px;">🎓</div>`}
                        <div class="school-name">${school.name}</div>
                        <div class="school-address">${school.address}, ${school.district}</div>
                        <div class="school-meta">UDISE Code: ${school.udiseCode} | Email: ${school.websiteConfig?.contactEmail || '-'}</div>
                    </div>

                    <div class="ref-row">
                        <div>Ref No: ${formData.refNo || '__________'}</div>
                        <div>Dated: ${issueFormatted}</div>
                    </div>

                    <div class="cert-title">
                        <span class="title-text">Date of Birth Certificate</span>
                    </div>

                    <div class="content">
                        This is to certify that <span class="highlight">${formData.studentName}</span>, 
                        ${relation} ${parentText}, 
                        resident of <span class="small-highlight">${formData.address}</span>, 
                        <span class="small-highlight">${formData.status}</span> in Class <span class="small-highlight">${formData.class}</span> 
                        during the Session <span class="small-highlight">${formData.session}</span> 
                        under Roll No. <span class="small-highlight">${formData.rollNo || 'N/A'}</span> 
                        ${formData.admissionNo ? `(Adm No: ${formData.admissionNo})` : ''}.
                        <br><br>
                        According to the school records, ${hisHer} Date of Birth is:
                        
                        <div class="dob-box">
                            <div class="dob-row">
                                <div class="dob-label">In Figures:</div>
                                <div class="dob-val">${dobFormatted}</div>
                            </div>
                            <div class="dob-row">
                                <div class="dob-label">In Words:</div>
                                <div class="dob-val" style="text-transform:uppercase;">${dobWords}</div>
                            </div>
                        </div>

                        Hence, this Date of Birth Certificate is issued for reference purposes.
                    </div>

                    <div class="footer">
                        <div class="sig-block">
                            <div style="height:50px;"></div>
                            <div class="sig-line">Admission Incharge</div>
                        </div>
                        <div class="sig-block">
                            ${school.signatureUrl ? `<img src="${school.signatureUrl}" style="height:50px; object-fit:contain; margin-bottom:5px;" />` : '<div style="height:50px;"></div>'}
                            <div class="sig-line">Principal / Headmaster</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 font-display">DOB Certificate</h1>
                <p className="text-sm text-slate-500">Generate official Date of Birth certificates.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Input Form */}
            <div className="lg:col-span-5 space-y-6">
                
                {/* Student Search */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative z-20">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Select Student</h3>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search database..." 
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium transition-all"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                            onFocus={() => setShowDropdown(true)}
                        />
                        {showDropdown && searchTerm && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto custom-scrollbar p-2 animate-fade-in-down">
                                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                    <button 
                                        key={student.id} 
                                        onClick={() => handleSelectStudent(student)}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium"
                                    >
                                        <div className="font-bold">{student.name}</div>
                                        <div className="text-xs text-slate-400">Class: {student.class} | Roll: {student.rollNo}</div>
                                    </button>
                                )) : (
                                    <div className="p-3 text-center text-sm text-slate-400 italic">No students found.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Manual Form */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Student Name</label>
                            <input type="text" value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value.toUpperCase()})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
                                <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Father's Name</label>
                            <input type="text" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value.toUpperCase()})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mother's Name</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="includeMother" 
                                        checked={includeMotherName} 
                                        onChange={e => setIncludeMotherName(e.target.checked)} 
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <label htmlFor="includeMother" className="text-[10px] font-bold text-indigo-600 cursor-pointer select-none">Include in Cert.</label>
                                </div>
                            </div>
                            <input type="text" value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value.toUpperCase()})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" disabled={!includeMotherName} placeholder={!includeMotherName ? 'Excluded from certificate' : ''} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Address</label>
                            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Status</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white font-medium">
                                    <option value="is reading">Is Reading</option>
                                    <option value="was reading">Was Reading</option>
                                    <option value="passed">Passed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Session</label>
                                <input type="text" value={formData.session} onChange={e => setFormData({...formData, session: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" placeholder="2024-25" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class</label>
                                <input type="text" value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" placeholder="e.g. 5th" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Roll No</label>
                                <input type="text" value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admission No</label>
                                <input type="text" value={formData.admissionNo} onChange={e => setFormData({...formData, admissionNo: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reference No</label>
                                <input type="text" value={formData.refNo} onChange={e => setFormData({...formData, refNo: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" placeholder="Ref/202X/..." />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Issue Date</label>
                            <input type="date" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
                        </div>
                        
                        <button onClick={handlePrint} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl hover:bg-slate-800 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-4">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Print Certificate
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Live Preview */}
            <div className="lg:col-span-7 hidden lg:block">
                <div className="sticky top-24">
                    <div className="bg-white rounded-none shadow-2xl border border-slate-200 aspect-[210/297] w-full relative overflow-hidden origin-top transform scale-95 p-8 flex flex-col pointer-events-none select-none">
                        {/* Mock A4 Preview */}
                        <div className="border-2 border-slate-900 h-full p-1 flex flex-col">
                            <div className="border border-slate-900 h-full p-8 flex flex-col relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-black opacity-[0.03] -rotate-12 whitespace-nowrap text-slate-900 uppercase">{school?.watermarkText || school?.name || 'School Name'}</div>
                                
                                <div className="text-center mb-4">
                                    <h2 className="text-2xl font-black text-rose-700 uppercase font-display tracking-tight mb-1">{school?.name || 'School Name'}</h2>
                                    <p className="text-xs font-bold uppercase text-slate-500">{school?.address || 'Address'}, {school?.district}</p>
                                </div>

                                <div className="flex justify-between items-center w-full px-2 mt-2 mb-4 font-bold text-slate-700 text-xs">
                                    <span>Ref No: {formData.refNo || '_______'}</span>
                                    <span>Dated: {issueFormatted}</span>
                                </div>

                                <div className="text-center mb-8 border-b-2 border-slate-900 inline-block mx-auto pb-1 px-4">
                                    <span className="font-display font-bold text-lg uppercase tracking-widest">Date of Birth Certificate</span>
                                </div>

                                <div className="text-sm leading-loose text-justify font-serif text-slate-800">
                                    This is to certify that <span className="font-bold uppercase px-1">{formData.studentName || '__________'}</span>, 
                                    {formData.gender === 'Female' ? 'Daughter of' : 'Son of'} <span className="font-bold uppercase px-1">{formData.fatherName || '__________'}</span> 
                                    {includeMotherName && (
                                        <> and <span className="font-bold uppercase px-1">{formData.motherName || '__________'}</span></>
                                    )}, 
                                    resident of <span className="font-bold px-1">{formData.address || '__________'}</span>, 
                                    <span className="font-bold px-1">{formData.status}</span> in Class <span className="font-bold px-1">{formData.class || '___'}</span> 
                                    during the Session <span className="font-bold px-1">{formData.session}</span>
                                    under Roll No. <span className="font-bold px-1">{formData.rollNo || '__'}</span>.
                                    <br/><br/>
                                    According to the school records, {formData.gender === 'Female' ? 'Her' : 'His'} Date of Birth is:
                                </div>

                                <div className="bg-slate-50 border border-slate-200 p-4 my-6 rounded">
                                    <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                                        <span className="font-bold text-slate-500">In Figures:</span>
                                        <span className="col-span-2 font-mono font-bold text-lg">{dobFormatted || '--/--/----'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <span className="font-bold text-slate-500">In Words:</span>
                                        <span className="col-span-2 font-bold uppercase text-xs leading-relaxed">{dobWords || '____________________'}</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex justify-between items-end pt-12">
                                    <div className="text-center w-32">
                                        <div className="h-8"></div>
                                        <div className="text-[10px] font-bold uppercase border-t border-slate-900 pt-1">Adm. Incharge</div>
                                    </div>
                                    <div className="text-center w-32">
                                        <div className="h-8 mb-1 flex items-end justify-center">
                                            {school?.signatureUrl && <img src={school.signatureUrl} className="h-full object-contain opacity-60" />}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase border-t border-slate-900 pt-1">Principal</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DOBCertificate;
