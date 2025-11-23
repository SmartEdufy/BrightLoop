
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { SchoolProfile } from '../../types';
import { Link } from 'react-router-dom';

const THEME_COLORS = [
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Emerald', value: 'emerald', class: 'bg-emerald-500' },
  { name: 'Rose', value: 'rose', class: 'bg-rose-500' },
  { name: 'Violet', value: 'violet', class: 'bg-violet-500' },
  { name: 'Amber', value: 'amber', class: 'bg-amber-500' },
  { name: 'Slate', value: 'slate', class: 'bg-slate-600' },
];

const AVAILABLE_FACILITIES = [
  "Smart Classrooms", "Science Lab", "Computer Lab", "Library", 
  "Sports Complex", "Transport", "CCTV Security", "Cafeteria",
  "Auditorium", "Medical Room", "Wi-Fi Campus", "Art Studio"
];

const WebsiteSettings: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [school, setSchool] = useState<SchoolProfile | null>(null);

  // File Upload State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form State
  const [config, setConfig] = useState({
    welcomeMessage: '',
    abbreviation: '',
    heroImageUrl: '',
    logoUrl: '',
    aboutText: '',
    facilities: [] as string[],
    socialLinks: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
    admissionOpen: true,
    themeColor: 'indigo',
    contactEmail: '',
    contactPhone: '',
    notifications: [] as { id: string; title: string; date: string }[]
  });

  // New Notification State
  const [newNotif, setNewNotif] = useState({ title: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!userProfile?.schoolId) return;

      if (userProfile.schoolId === 'demo-school') {
         // Mock Data for Demo
         setConfig({
            welcomeMessage: 'Empowering the next generation of leaders through excellence in education.',
            abbreviation: 'GVIS',
            heroImageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2832&auto=format&fit=crop',
            logoUrl: '',
            aboutText: 'Founded in 1995, Green Valley International School has been a pioneer in providing quality education. Our mission is to foster an environment where students can explore their potential and develop into responsible global citizens.',
            facilities: ['Smart Classrooms', 'Library', 'Sports Complex', 'Transport'],
            socialLinks: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', twitter: '', linkedin: '', youtube: '' },
            admissionOpen: true,
            themeColor: 'indigo',
            contactEmail: 'info@greenvalley.edu',
            contactPhone: '+1 (123) 456-7890',
            notifications: [
              { id: '1', title: 'Annual Sports Day scheduled for next month.', date: '2 days ago' },
              { id: '2', title: 'Parent-Teacher Meeting for Class 10th.', date: '5 days ago' },
            ]
         });
         setLoading(false);
         return;
      }

      try {
        const docRef = doc(db, 'schools', userProfile.schoolId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as SchoolProfile;
          setSchool(data);
          if (data.websiteConfig) {
            setConfig({
                welcomeMessage: data.websiteConfig.welcomeMessage || '',
                abbreviation: data.websiteConfig.abbreviation || '',
                heroImageUrl: data.websiteConfig.heroImageUrl || '',
                logoUrl: data.websiteConfig.logoUrl || '',
                aboutText: data.websiteConfig.aboutText || '',
                facilities: data.websiteConfig.facilities || [],
                socialLinks: { 
                    facebook: data.websiteConfig.socialLinks?.facebook || '',
                    instagram: data.websiteConfig.socialLinks?.instagram || '',
                    twitter: data.websiteConfig.socialLinks?.twitter || '',
                    linkedin: data.websiteConfig.socialLinks?.linkedin || '',
                    youtube: data.websiteConfig.socialLinks?.youtube || ''
                },
                admissionOpen: data.websiteConfig.admissionOpen ?? true,
                themeColor: data.websiteConfig.themeColor || 'indigo',
                contactEmail: data.websiteConfig.contactEmail || '',
                contactPhone: data.websiteConfig.contactPhone || '',
                notifications: data.websiteConfig.notifications || []
            });
            if (data.websiteConfig.logoUrl) setLogoPreview(data.websiteConfig.logoUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolData();
  }, [userProfile?.schoolId]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
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
          console.error("Upload failed:", error);
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

  const handleSave = async () => {
    if (!userProfile?.schoolId) return;
    setSaving(true);

    if (currentUser?.uid === 'demo-user-123') {
        setTimeout(() => {
            setSaving(false);
            alert("Demo Mode: Settings saved logically (not to database).");
        }, 800);
        return;
    }

    try {
      let finalLogoUrl = config.logoUrl;
      if (logoFile) {
         finalLogoUrl = await uploadFile(logoFile, `schools/${userProfile.schoolId}/logo.png`);
      }

      const docRef = doc(db, 'schools', userProfile.schoolId);
      await updateDoc(docRef, {
        websiteConfig: {
            ...config,
            logoUrl: finalLogoUrl
        }
      });
      setConfig(prev => ({ ...prev, logoUrl: finalLogoUrl }));
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const toggleFacility = (facility: string) => {
    if (config.facilities.includes(facility)) {
        setConfig({...config, facilities: config.facilities.filter(f => f !== facility)});
    } else {
        setConfig({...config, facilities: [...config.facilities, facility]});
    }
  };

  const addNotification = () => {
    if (!newNotif.title) return;
    setConfig(prev => ({
      ...prev,
      notifications: [
        { id: Date.now().toString(), title: newNotif.title, date: newNotif.date },
        ...prev.notifications
      ]
    }));
    setNewNotif({ title: '', date: new Date().toISOString().split('T')[0] });
  };

  const removeNotification = (id: string) => {
    setConfig(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  };

  if (loading) {
    return (
        <DashboardLayout>
            <div className="animate-pulse space-y-8 max-w-6xl mx-auto">
                <div className="h-8 bg-slate-200 rounded-full w-1/3 mb-8"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="h-96 bg-slate-200 rounded-3xl"></div>
                    <div className="h-96 bg-slate-200 rounded-3xl"></div>
                    <div className="h-96 bg-slate-200 rounded-3xl"></div>
                </div>
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 font-display tracking-tight">Website Studio</h2>
                <p className="text-slate-500 mt-1 text-base font-medium">Design your school's public digital identity.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                {userProfile?.schoolId && (
                    <Link to={`/s/${userProfile.schoolId}`} target="_blank" className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 hover:text-indigo-600 transition-all shadow-sm group">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:bg-emerald-400"></span>
                        Live Preview
                    </Link>
                )}
                <button 
                    onClick={handleSave} 
                    disabled={saving || uploadProgress !== null}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 disabled:opacity-70 flex items-center gap-2 min-w-[140px] justify-center"
                >
                    {saving ? (
                         <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                    {saving ? 'Publishing...' : 'Publish Changes'}
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Column 1: Visual Identity (4 cols) */}
            <div className="lg:col-span-4 space-y-8">
                
                {/* Logo & Branding */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        Visual Identity
                    </h3>
                    
                    <div className="space-y-6">
                        {/* Logo Upload */}
                        <div>
                             <label className="block text-sm font-bold text-slate-700 mb-3">School Logo</label>
                             <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 hover:border-indigo-300 transition-colors">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        )}
                                    </div>
                                    <label htmlFor="logo-upload" className="absolute inset-0 cursor-pointer"></label>
                                    <input type="file" id="logo-upload" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500 leading-relaxed mb-2">Recommended: 512x512px PNG with transparent background.</p>
                                    <label htmlFor="logo-upload" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                    </label>
                                </div>
                             </div>
                        </div>

                        {/* Hero Image */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Hero Image URL</label>
                            <input 
                                type="text" 
                                value={config.heroImageUrl} 
                                onChange={e => setConfig({...config, heroImageUrl: e.target.value})} 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium transition-all"
                                placeholder="https://example.com/campus.jpg"
                            />
                            {config.heroImageUrl && (
                                <div className="mt-3 w-full h-32 rounded-xl overflow-hidden border border-slate-200 relative">
                                    <img src={config.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20"></div>
                                </div>
                            )}
                        </div>
                        
                        {/* Theme Color */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Accent Color</label>
                            <div className="flex flex-wrap gap-3">
                                {THEME_COLORS.map(theme => (
                                    <button 
                                        key={theme.value}
                                        onClick={() => setConfig({...config, themeColor: theme.value})}
                                        className={`w-8 h-8 rounded-full ${theme.class} ring-2 ring-offset-2 transition-all ${config.themeColor === theme.value ? `ring-${theme.value}-500 scale-110` : 'ring-transparent hover:scale-105'}`}
                                        title={theme.name}
                                    />
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
                
                {/* Contact & Socials */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        Contact & Socials
                    </h3>
                    <div className="space-y-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Public Email</label>
                            <input type="email" value={config.contactEmail} onChange={e => setConfig({...config, contactEmail: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="info@school.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone</label>
                            <input type="tel" value={config.contactPhone} onChange={e => setConfig({...config, contactPhone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="+91 9876543210" />
                        </div>
                        <div className="border-t border-slate-100 my-4"></div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Facebook URL</label>
                            <input type="text" value={config.socialLinks.facebook} onChange={e => setConfig({...config, socialLinks: {...config.socialLinks, facebook: e.target.value}})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="https://facebook.com/..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Instagram URL</label>
                            <input type="text" value={config.socialLinks.instagram} onChange={e => setConfig({...config, socialLinks: {...config.socialLinks, instagram: e.target.value}})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="https://instagram.com/..." />
                        </div>
                    </div>
                </div>

            </div>

            {/* Column 2: Main Content (5 cols) */}
            <div className="lg:col-span-5 space-y-8">
                 <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm h-full">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Homepage Content</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Headline / Welcome Message</label>
                            <textarea 
                                value={config.welcomeMessage} 
                                onChange={e => setConfig({...config, welcomeMessage: e.target.value})} 
                                rows={2}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-lg"
                                placeholder="e.g. Shaping the Future"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">About Us</label>
                            <textarea 
                                value={config.aboutText} 
                                onChange={e => setConfig({...config, aboutText: e.target.value})} 
                                rows={6}
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm leading-relaxed"
                                placeholder="Describe your school's history, mission, and values..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Campus Facilities</label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_FACILITIES.map(facility => (
                                    <button
                                        key={facility}
                                        onClick={() => toggleFacility(facility)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${config.facilities.includes(facility) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                    >
                                        {facility}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Admissions Open</h4>
                                    <p className="text-xs text-slate-500">Show "Apply Now" button on homepage</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={config.admissionOpen} onChange={(e) => setConfig({...config, admissionOpen: e.target.checked})} />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                        </div>

                    </div>
                 </div>
            </div>

            {/* Column 3: Notifications (3 cols) */}
            <div className="lg:col-span-3 space-y-8">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm h-full flex flex-col">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Notice Board</h3>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        <input 
                            type="text" 
                            value={newNotif.title}
                            onChange={e => setNewNotif({...newNotif, title: e.target.value})}
                            placeholder="Event or Notice..." 
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                        <div className="flex gap-2">
                             <input 
                                type="text" 
                                value={newNotif.date}
                                onChange={e => setNewNotif({...newNotif, date: e.target.value})}
                                placeholder="Date" 
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            />
                            <button onClick={addNotification} disabled={!newNotif.title} className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all">Add</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 max-h-[400px]">
                        {config.notifications.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No notices posted.</p>}
                        {config.notifications.map(n => (
                            <div key={n.id} className="group relative p-3 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition-shadow">
                                <p className="text-sm font-bold text-slate-800 leading-snug pr-6">{n.title}</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{n.date}</p>
                                <button onClick={() => removeNotification(n.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WebsiteSettings;
