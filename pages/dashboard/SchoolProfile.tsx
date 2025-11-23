
import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { SchoolProfile, SchoolType, MASTER_CLASS_LIST } from '../../types';
import { Link } from 'react-router-dom';

const SchoolProfilePage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    udiseCode: '',
    type: SchoolType.PRIMARY,
    management: 'GOVT' as 'GOVT' | 'PRIVATE',
    regNo: '',
    headmasterName: '',
    watermarkText: '',
    zone: '',
    district: '',
    state: '',
    address: '',
    rollStatementClasses: [] as string[]
  });

  // Signature State
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSchool = async () => {
      if (!userProfile?.schoolId) return;

      if (userProfile.schoolId === 'demo-school') {
         // Mock Data
         const mockSchool: any = {
            id: 'demo-school',
            name: 'Green Valley International School',
            udiseCode: 'UDISE-2024-001',
            type: SchoolType.HIGHER_SECONDARY,
            management: 'PRIVATE',
            regNo: 'REG-998877',
            headmasterName: 'Dr. Robert Smith',
            watermarkText: 'G.V.I.S',
            zone: 'Central',
            district: 'Metro City',
            state: 'California',
            address: '123 Education Lane',
            signatureUrl: null,
            websiteConfig: { themeColor: 'indigo', heroImageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2832&auto=format&fit=crop' },
            rollStatementClasses: ['12th', '11th', '10th', '9th', '8th', '7th', '6th']
         };
         setSchool(mockSchool);
         setFormData(mockSchool);
         setSignaturePreview(mockSchool.signatureUrl);
         setLoading(false);
         return;
      }

      try {
        const docRef = doc(db, 'schools', userProfile.schoolId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as SchoolProfile;
          setSchool(data);
          setFormData({
             name: data.name,
             udiseCode: data.udiseCode,
             type: data.type,
             management: data.management || 'GOVT',
             regNo: data.regNo || '',
             headmasterName: data.headmasterName,
             watermarkText: data.watermarkText || '',
             zone: data.zone,
             district: data.district,
             state: data.state,
             address: data.address,
             rollStatementClasses: data.rollStatementClasses || getDefaultClasses(data.type)
          });
          if (data.signatureUrl) setSignaturePreview(data.signatureUrl);
        }
      } catch (error) {
        console.error("Error fetching school:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchool();
  }, [userProfile?.schoolId]);

  const getDefaultClasses = (type: SchoolType) => {
      let classes = ['5th', '4th', '3rd', '2nd', '1st']; // Base Primary
      if (type === SchoolType.MIDDLE) classes = ['8th', '7th', '6th', ...classes];
      if (type === SchoolType.SECONDARY) classes = ['10th', '9th', ...classes]; // Replaces middle logic usually, but let's append
      if (type === SchoolType.HIGHER_SECONDARY) classes = ['12th', '11th', '10th', '9th'];
      
      // Filter against master list to ensure validity and sort
      return MASTER_CLASS_LIST.filter(c => classes.includes(c));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setSignaturePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setUploadProgress(null);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setUploadProgress(null);
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleClassToggle = (cls: string) => {
      setFormData(prev => {
          const current = prev.rollStatementClasses || [];
          let updated;
          if (current.includes(cls)) {
              updated = current.filter(c => c !== cls);
          } else {
              updated = [...current, cls];
          }
          // Always sort based on MASTER_CLASS_LIST index
          updated.sort((a, b) => MASTER_CLASS_LIST.indexOf(a) - MASTER_CLASS_LIST.indexOf(b));
          return { ...prev, rollStatementClasses: updated };
      });
  };

  const handleSave = async () => {
    if (!userProfile?.schoolId) return;
    setSaving(true);

    if (currentUser?.uid === 'demo-user-123') {
        setTimeout(() => {
            setSaving(false);
            setEditMode(false);
            alert("Demo Mode: Changes saved logically.");
        }, 800);
        return;
    }

    try {
      let signatureUrl = signaturePreview;
      if (signatureFile) {
         signatureUrl = await uploadFile(signatureFile, `schools/${userProfile.schoolId}/signature_${Date.now()}.png`);
      }

      const docRef = doc(db, 'schools', userProfile.schoolId);
      await updateDoc(docRef, {
        ...formData,
        signatureUrl: signatureUrl
      });

      // Update local state
      if(school) setSchool({...school, ...formData, signatureUrl: signatureUrl || undefined});
      setEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  if (loading) {
    return (
        <DashboardLayout>
            <div className="animate-pulse space-y-8 max-w-5xl mx-auto">
                <div className="h-64 bg-slate-200 rounded-[2.5rem]"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="h-96 bg-slate-200 rounded-3xl"></div>
                   <div className="h-96 bg-slate-200 rounded-3xl"></div>
                </div>
            </div>
        </DashboardLayout>
    );
  }

  if (!school) return <div className="p-12 text-center">School profile not found.</div>;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
         
         {/* HEADER / HERO */}
         <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl shadow-slate-200/50 group">
            {/* Background Image */}
            {school.websiteConfig?.heroImageUrl ? (
                <img src={school.websiteConfig.heroImageUrl} alt="School Cover" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-800 opacity-80"></div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div className="flex items-end gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-white p-2 shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-300">
                        {school.websiteConfig?.logoUrl ? (
                            <img src={school.websiteConfig.logoUrl} className="w-full h-full object-contain" alt="Logo" />
                        ) : (
                            <div className="w-full h-full bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-3xl">{school.name[0]}</div>
                        )}
                    </div>
                    <div className="mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-white font-display tracking-tight leading-none mb-2">{school.name}</h1>
                        <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-white border border-white/10">{school.type}</span>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${school.management === 'PRIVATE' ? 'bg-amber-500/20 border-amber-500/40 text-amber-100' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100'}`}>
                                {school.management === 'PRIVATE' ? 'Private' : 'Government'}
                            </span>
                            <span>{school.district}, {school.state}</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => editMode ? handleSave() : setEditMode(true)}
                    disabled={saving || uploadProgress !== null}
                    className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-70 ${editMode ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20' : 'bg-white hover:bg-indigo-50 text-slate-900 shadow-white/10'}`}
                >
                    {saving ? (
                         <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : editMode ? (
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    )}
                    {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Edit Profile'}
                </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: GENERAL INFO & CLASSES */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 font-display">Academic Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">School Name</label>
                            <input 
                                type="text" 
                                value={formData.name} 
                                disabled={!editMode}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 disabled:opacity-70 disabled:bg-slate-50" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">UDISE Code</label>
                            <input 
                                type="text" 
                                value={formData.udiseCode} 
                                disabled={!editMode}
                                onChange={e => setFormData({...formData, udiseCode: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-70 disabled:bg-slate-50" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">School Type</label>
                            <div className="relative">
                                <select 
                                    value={formData.type} 
                                    disabled={!editMode}
                                    onChange={e => setFormData({...formData, type: e.target.value as SchoolType})}
                                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-70 disabled:bg-slate-50 appearance-none" 
                                >
                                    {Object.values(SchoolType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Management Type */}
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Management</label>
                            <div className="relative">
                                <select 
                                    value={formData.management} 
                                    disabled={!editMode}
                                    onChange={e => setFormData({...formData, management: e.target.value as 'GOVT' | 'PRIVATE'})}
                                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-70 disabled:bg-slate-50 appearance-none" 
                                >
                                    <option value="GOVT">Government</option>
                                    <option value="PRIVATE">Private</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Document Watermark */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Document Watermark</label>
                            <input 
                                type="text" 
                                value={formData.watermarkText} 
                                disabled={!editMode}
                                onChange={e => setFormData({...formData, watermarkText: e.target.value})}
                                placeholder="e.g. School Name"
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-70 disabled:bg-slate-50" 
                            />
                        </div>

                        {/* Registration Number (Private Only) */}
                        {formData.management === 'PRIVATE' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Registration No.</label>
                                <input 
                                    type="text" 
                                    value={formData.regNo} 
                                    disabled={!editMode}
                                    onChange={e => setFormData({...formData, regNo: e.target.value})}
                                    placeholder="e.g. REG-12345"
                                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-70 disabled:bg-slate-50" 
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* CLASSES CONFIGURATION */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 font-display">Roll Statement Classes</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">Select the classes that are active in your school. These will appear in your Roll Statement reports.</p>
                    
                    <div className="flex flex-wrap gap-3">
                        {MASTER_CLASS_LIST.map(cls => {
                            const isSelected = formData.rollStatementClasses?.includes(cls);
                            return (
                                <button
                                    key={cls}
                                    onClick={() => editMode && handleClassToggle(cls)}
                                    disabled={!editMode}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200'} ${editMode ? 'hover:scale-105 cursor-pointer' : 'opacity-70 cursor-default'}`}
                                >
                                    {cls}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 font-display">Location & Address</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Address</label>
                            <input 
                                type="text" 
                                value={formData.address} 
                                disabled={!editMode}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-70 disabled:bg-slate-50" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Zone</label>
                            <input 
                                type="text" 
                                value={formData.zone} 
                                disabled={!editMode}
                                onChange={e => setFormData({...formData, zone: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-70 disabled:bg-slate-50" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">District</label>
                            <input 
                                type="text" 
                                value={formData.district} 
                                disabled={!editMode}
                                onChange={e => setFormData({...formData, district: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-70 disabled:bg-slate-50" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State</label>
                            <input 
                                type="text" 
                                value={formData.state} 
                                disabled={!editMode}
                                onChange={e => setFormData({...formData, state: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-70 disabled:bg-slate-50" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: ADMINISTRATION */}
            <div className="space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 font-display">Administration</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Headmaster / Principal</label>
                            <input 
                                type="text" 
                                value={formData.headmasterName} 
                                disabled={!editMode}
                                onChange={e => setFormData({...formData, headmasterName: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-70 disabled:bg-slate-50" 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Digital Signature</label>
                            <div className={`relative rounded-2xl border-2 border-dashed transition-colors p-6 flex flex-col items-center justify-center text-center bg-slate-50 ${editMode ? 'border-slate-300 hover:border-indigo-400 cursor-pointer hover:bg-indigo-50' : 'border-slate-200 opacity-70'}`}
                                 onClick={() => editMode && fileInputRef.current?.click()}
                            >
                                {signaturePreview ? (
                                    <img src={signaturePreview} alt="Signature" className="h-20 w-auto object-contain" />
                                ) : (
                                    <div className="text-slate-400">
                                        <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        <span className="text-xs font-bold">No Signature Uploaded</span>
                                    </div>
                                )}
                                
                                {editMode && (
                                    <div className="mt-4">
                                        <span className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-indigo-600 shadow-sm">
                                            {signaturePreview ? 'Replace File' : 'Upload File'}
                                        </span>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" disabled={!editMode} />
                                
                                {uploadProgress !== null && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                        <div className="w-3/4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                Security: This signature is securely stored and only used for auto-generating official documents like Transfer Certificates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

         </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolProfilePage;