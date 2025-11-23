import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../services/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { SchoolType, SchoolProfile } from '../../types';
import { useNavigate } from 'react-router-dom';

const SchoolSetup: React.FC = () => {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    zone: '',
    district: '',
    state: '',
    address: '',
    udiseCode: '',
    type: SchoolType.PRIMARY,
    headmasterName: '',
  });

  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);


  const getAbbreviation = (name: string) => {
    if(!name) return '';
    const stops = ['govt', 'government', 'school', 'middle', 'higher', 'secondary', 'primary', 'public'];
    return name.split(' ').map(w => w[0].toUpperCase()).join('') + " School"; 
  };

  useEffect(() => {
    const fetchExisting = async () => {
       if (userProfile?.schoolId && userProfile.schoolId !== 'demo-school') {
         const ref = doc(db, 'schools', userProfile.schoolId);
         try {
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const data = snap.data() as SchoolProfile;
              setFormData({
                name: data.name,
                zone: data.zone,
                district: data.district,
                state: data.state,
                address: data.address,
                udiseCode: data.udiseCode,
                type: data.type,
                headmasterName: data.headmasterName
              });
              if(data.signatureUrl) setSignaturePreview(data.signatureUrl);
            }
         } catch(e) {
            console.error("Could not fetch school profile");
         }
       }
    };
    fetchExisting();
  }, [userProfile?.schoolId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    if (currentUser.uid === 'demo-user-123') {
        setTimeout(() => {
            setLoading(false);
            navigate('/dashboard');
        }, 1000);
        return;
    }

    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
      const abbreviation = getAbbreviation(formData.name);
      
      let signatureUrl = signaturePreview || undefined;
      if (signatureFile) {
        signatureUrl = await uploadFile(signatureFile, `schools/${slug}/signature.png`);
      }

      const schoolData: SchoolProfile = {
        id: userProfile?.schoolId || slug, 
        ownerUid: currentUser.uid,
        ...formData,
        slug: slug,
        signatureUrl: signatureUrl,
        createdAt: new Date(),
        websiteConfig: {
           welcomeMessage: `Welcome to ${formData.name}`,
           abbreviation: abbreviation,
           heroImageUrl: '',
           notifications: [],
           themeColor: 'indigo',
           contactEmail: '',
           contactPhone: ''
        }
      };

      await setDoc(doc(db, 'schools', schoolData.id), schoolData, { merge: true });

      await updateDoc(doc(db, 'users', currentUser.uid), {
        schoolId: schoolData.id
      });

      await refreshProfile();
      navigate('/dashboard');
    } catch (error) {
      console.error("Error saving school:", error);
      alert("Failed to save school details. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 font-display tracking-tight">School Profile</h2>
            <p className="text-slate-500 mt-2 text-lg">Enter the details that will appear on your generated website.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
          
          {/* General Info Section */}
          <div>
             <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-6 border-b border-indigo-100 pb-2">General Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">School Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" placeholder="e.g. Govt Middle School Hardapanzoo" />
                </div>
                
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">UDISE Code</label>
                   <input required type="text" value={formData.udiseCode} onChange={e => setFormData({...formData, udiseCode: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" />
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">School Type</label>
                   <div className="relative">
                     <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as SchoolType})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium appearance-none">
                       {Object.values(SchoolType).map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                     <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                     </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Location Section */}
          <div>
             <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-6 border-b border-indigo-100 pb-2">Location Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Zone</label>
                   <input required type="text" value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">District</label>
                   <input required type="text" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">State</label>
                   <input required type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" />
                </div>
                 <div className="col-span-3">
                   <label className="block text-sm font-bold text-slate-700 mb-2">Full Address</label>
                   <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" />
                </div>
             </div>
          </div>

          {/* Admin Info Section */}
          <div>
             <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-6 border-b border-indigo-100 pb-2">Administration</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Headmaster / Principal Name</label>
                  <input required type="text" value={formData.headmasterName} onChange={e => setFormData({...formData, headmasterName: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" />
               </div>
               
               <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Digital Signature</label>
                    <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-300 transition-colors bg-slate-50">
                        <div className="flex items-center gap-6">
                            <input type="file" id="signature-upload" accept="image/*" onChange={handleFileChange} className="hidden"/>
                            <label htmlFor="signature-upload" className="flex-shrink-0 cursor-pointer px-6 py-2.5 rounded-full border-0 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700">
                                Choose File
                            </label>
                            {signaturePreview && (
                                <div className="h-20 w-32 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-2 shadow-sm">
                                    <img src={signaturePreview} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                                </div>
                            )}
                        </div>
                        {uploadProgress !== null && (
                            <div className="mt-4 w-full bg-slate-200 rounded-full h-2.5">
                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 ml-2">Used for automated document generation (Transfer Certs, Report Cards).</p>
                </div>
             </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={loading || uploadProgress !== null} className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Saving Details...' : (uploadProgress !== null ? `Uploading... ${Math.round(uploadProgress)}%` : 'Save School Profile')}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default SchoolSetup;