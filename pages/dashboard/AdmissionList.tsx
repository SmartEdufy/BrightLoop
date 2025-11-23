
import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/Layout';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { AdmissionData } from './Admission';

// --- HELPERS ---
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

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-4 mt-6 border-t border-slate-200 sm:px-6 bg-white rounded-2xl border shadow-sm">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700">
            Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
              .map((page, index, array) => {
                 const showEllipsis = index > 0 && page > array[index - 1] + 1;
                 return (
                   <React.Fragment key={page}>
                     {showEllipsis && <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300">...</span>}
                     <button
                        onClick={() => onPageChange(page)}
                        aria-current={page === currentPage ? 'page' : undefined}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                          page === currentPage
                            ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                   </React.Fragment>
                 )
              })}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTS ---

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isDangerous?: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDangerous = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in-down" style={{ animationDuration: '0.2s' }}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-sm md:max-w-md overflow-hidden border border-slate-100 transform transition-all scale-100">
        <div className="p-6 md:p-8">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 ring-4 ${isDangerous ? 'bg-red-50 text-red-500 ring-red-50' : 'bg-indigo-50 text-indigo-600 ring-indigo-50'}`}>
            {isDangerous ? (
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            ) : (
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 font-display">{title}</h3>
          <p className="mt-2 md:mt-3 text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
        <div className="bg-slate-50 px-5 py-3 md:px-6 md:py-4 flex justify-end gap-2 md:gap-3 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-200 text-xs md:text-sm">Cancel</button>
          <button 
            onClick={onConfirm} 
            className={`px-5 py-2 text-white font-bold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 text-xs md:text-sm ${isDangerous ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const UndoToast: React.FC<{ message: string; onUndo: () => void; isVisible: boolean }> = ({ message, onUndo, isVisible }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl shadow-slate-900/30 animate-fade-in-down min-w-[320px] justify-between">
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={onUndo}
        className="text-sm font-bold text-indigo-400 hover:text-white transition-colors flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
        Undo
      </button>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm h-[220px] flex flex-col relative">
        <div className="flex gap-4 mb-6">
            <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0"></div>
            <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
                <div className="h-3 w-1/3 bg-slate-100 rounded"></div>
            </div>
        </div>
        <div className="space-y-3 mb-6 flex-1">
            <div className="h-3 w-full bg-slate-100 rounded"></div>
            <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
        </div>
        <div className="mt-auto h-10 bg-slate-100 rounded-xl"></div>
      </div>
    ))}
  </div>
);

// --- MAIN COMPONENT ---

const AdmissionList: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [students, setStudents] = useState<AdmissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection & Pagination State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  
  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    idsToDelete: string[];
  }>({ isOpen: false, title: '', message: '', idsToDelete: [] });

  // Undo / Deletion State
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const undoTimerRef = useRef<any>(null);
  const pendingDeletionRef = useRef<{ ids: string[]; records: AdmissionData[] } | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        commitDelete(true);
      }
    };
  }, [userProfile?.schoolId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    if (!userProfile?.schoolId) return;
    
    // DEMO MODE HANDLING
    if (userProfile.schoolId === 'demo-school') {
        setStudents([
            {
                id: 'demo-1',
                schoolName: 'Green Valley School',
                fullName: 'Rahul Kumar',
                admissionClass: '5th',
                admissionNo: 'A-101',
                dob: '2015-05-12',
                phone: '9876543210',
                bankAccount: '1234567890123456',
                ifsc: 'SBIN0001234',
                schoolId: 'demo-school',
                createdAt: new Date().toISOString(),
                dobWords: 'Twelfth May Two Thousand Fifteen', aadhaar: '123412341234', fatherName: 'Vijay Kumar', motherName: 'Sunita Devi', guardianOcc: 'Business',
                residence: '123 Demo St', lastSchool: 'Previous School', lastClass: '4th', certNumber: 'TC-99', penNo: 'PEN-123', bankName: 'SBI',
                zone: 'Central', district: 'Metro', udiseCode: 'UDISE-2024', schoolEmail: 'info@school.com', session: '2025-26', admissionDate: '2025-04-01',
                category: 'OM', schoolManagement: 'PRIVATE'
            },
            {
                id: 'demo-2',
                schoolName: 'Green Valley School',
                fullName: 'Priya Sharma',
                admissionClass: '10th',
                admissionNo: 'A-205',
                dob: '2010-08-22',
                phone: '9876543211',
                bankAccount: '1234567890123457',
                ifsc: 'HDFC0001234',
                schoolId: 'demo-school',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                dobWords: 'Twenty Second August Two Thousand Ten', aadhaar: '123412341235', fatherName: 'Raj Sharma', motherName: 'Meera Sharma', guardianOcc: 'Service',
                residence: '456 Sample Rd', lastSchool: 'City Public School', lastClass: '9th', certNumber: 'TC-100', penNo: 'PEN-124', bankName: 'HDFC',
                zone: 'Central', district: 'Metro', udiseCode: 'UDISE-2024', schoolEmail: 'info@school.com', session: '2025-26', admissionDate: '2025-04-02',
                category: 'OM', schoolManagement: 'PRIVATE'
            }
        ]);
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'admission_forms'), where('schoolId', '==', userProfile.schoolId));
      const snap = await getDocs(q);
      const data: AdmissionData[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdmissionData));
      // Sort by Created At Desc
      data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (isMounted.current) setStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filtered.map(s => s.id!)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const initiateDelete = (ids: string[]) => {
    const isBulk = ids.length > 1;
    setModalConfig({
      isOpen: true,
      title: isBulk ? `Delete ${ids.length} Records?` : 'Delete Record?',
      message: isBulk 
        ? `Are you sure you want to delete ${ids.length} selected records? This action can be undone briefly.` 
        : 'Are you sure you want to delete this admission record? This action can be undone briefly.',
      idsToDelete: ids
    });
  };

  const confirmDelete = () => {
    const ids = modalConfig.idsToDelete;
    
    if (pendingDeletionRef.current) {
        commitDelete(true);
    }

    const recordsToDelete = students.filter(s => ids.includes(s.id!));
    pendingDeletionRef.current = { ids, records: recordsToDelete };

    setStudents(prev => prev.filter(s => !ids.includes(s.id!)));
    setSelectedIds(new Set());
    setModalConfig({ ...modalConfig, isOpen: false });

    setToast({ visible: true, message: `${ids.length} Record(s) deleted` });
    
    undoTimerRef.current = setTimeout(() => {
        commitDelete();
    }, 4000);
  };

  const commitDelete = async (skipUi = false) => {
    if (isMounted.current && !skipUi) {
        setToast({ visible: false, message: '' });
    }
    undoTimerRef.current = null;

    if (!pendingDeletionRef.current) return;
    const { ids } = pendingDeletionRef.current;
    pendingDeletionRef.current = null;

    if (userProfile?.schoolId === 'demo-school') return;

    try {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const ref = doc(db, 'admission_forms', id);
            batch.delete(ref);
        });
        await batch.commit();
    } catch (e) {
        console.error("Error deleting", e);
        if (isMounted.current && !skipUi) fetchData();
    }
  };

  const handleUndo = () => {
    if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
    }

    if (pendingDeletionRef.current) {
        const { records } = pendingDeletionRef.current;
        setStudents(prev => [...prev, ...records].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        pendingDeletionRef.current = null;
        setToast({ visible: false, message: '' });
    }
  };

  const handleEdit = (student: AdmissionData) => {
    navigate('/dashboard/admission', { state: { studentData: student } });
  };

  // --- PRINT LOGIC (Same as Admission.tsx) ---
  const handlePrint = (formData: AdmissionData) => {
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
            :root { --green: #68B92E; --blue: #0084C4; --red: #DE4019; --black: #1F1A16; --border-color: #1F1A16; }
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; background: white; font-family: 'Inter', sans-serif; color: var(--black); font-size: 10pt; line-height: 1.3; }
            .page-container { width: 210mm; height: 296mm; padding: 5mm 6mm; margin: 0 auto; position: relative; display: flex; flex-direction: column; overflow: hidden; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-family: 'Playfair Display', serif; font-size: 60px; font-weight: 900; color: var(--green); opacity: 0.06; text-align: center; width: 90%; pointer-events: none; z-index: 0; white-space: normal; overflow-wrap: break-word; line-height: 1.2; }
            .main-frame { flex: 1; display: flex; flex-direction: column; border: 2px solid var(--border-color); background: transparent; margin-bottom: 6px; }
            .header { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; border-bottom: 3px double var(--red); background: white; position: relative; }
            .logo-section { width: 75px; height: 75px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: white; border: 2px solid var(--red); border-radius: 12px; color: var(--red); box-shadow: 3px 3px 0px rgba(222, 64, 25, 0.1); }
            .header-text { flex: 1; text-align: center; padding: 0 20px; display: flex; flex-direction: column; justify-content: center; }
            .school-name { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 900; color: var(--red); text-transform: uppercase; line-height: 1; margin-bottom: 4px; letter-spacing: -0.5px; white-space: nowrap; }
            .sub-heading { font-size: 11pt; font-weight: 700; color: var(--black); text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
            .meta-bar { display: flex; justify-content: center; gap: 12px; font-size: 8.5pt; color: var(--black); font-weight: 500; flex-wrap: wrap; align-items: center; }
            .meta-text { display: inline-flex; align-items: center; gap: 4px; }
            .meta-badge { background: var(--black); color: white; padding: 1px 6px; border-radius: 3px; font-weight: 700; font-size: 7pt; text-transform: uppercase; }
            .office-use-strip { background: var(--red); color: white; font-size: 11pt; font-weight: 800; text-align: center; padding: 4px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid var(--border-color); }
            .office-grid { display: grid; grid-template-columns: 1fr 1.5fr 0.8fr; border-bottom: 2px solid var(--border-color); }
            .office-cell { padding: 6px 10px; border-right: 1px solid var(--border-color); display: flex; align-items: center; gap: 8px; }
            .office-cell:last-child { border-right: none; }
            .label { font-size: 8pt; font-weight: 800; color: var(--black); text-transform: uppercase; }
            .value { font-size: 10pt; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: var(--blue); }
            .form-title { background: var(--black); color: white; text-align: center; font-size: 13px; font-weight: 800; padding: 5px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid var(--border-color); }
            .data-container { display: flex; border-bottom: 2px solid var(--border-color); height: 170px; }
            .photo-area { width: 140px; border-left: 2px solid var(--border-color); padding: 6px; display: flex; align-items: center; justify-content: center; }
            .photo-box { width: 100%; height: 100%; border: 2px dashed var(--black); display: flex; align-items: center; justify-content: center; background: #f4f4f4; overflow: hidden; }
            .photo-img { width: 100%; height: 100%; object-fit: cover; }
            .details-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; }
            .grid-item { padding: 4px 10px; border-bottom: 1px solid #aaa; border-right: 1px solid #aaa; display: flex; flex-direction: column; justify-content: center; }
            .grid-item:nth-child(even) { border-right: none; }
            .grid-item.full { grid-column: span 2; }
            .grid-item:last-child, .grid-item:nth-last-child(2):nth-child(odd) { border-bottom: none; }
            .field-label { font-size: 7.5pt; color: #444; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
            .field-val { font-size: 10.5pt; font-weight: 700; color: var(--black); line-height: 1.1; }
            .blue-text { color: var(--blue); }
            .section-header { background: var(--blue); color: white; padding: 4px 10px; font-size: 10pt; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid var(--border-color); border-top: 1px solid var(--border-color); letter-spacing: 0.5px; }
            .section-header.first { border-top: none; }
            .compact-grid { display: grid; grid-template-columns: repeat(4, 1fr); font-size: 10pt; }
            .compact-cell { padding: 6px 10px; border-bottom: 1px solid #bbb; border-right: 1px solid #bbb; display: flex; flex-direction: column; justify-content: center; }
            .compact-cell:nth-child(4n) { border-right: none; }
            .compact-cell.span-2 { grid-column: span 2; border-right: 1px solid #bbb; }
            .compact-cell.span-4 { grid-column: span 4; border-right: none; }
            .declaration-box { padding: 10px 12px; font-size: 8.5pt; text-align: justify; border-bottom: 2px solid var(--border-color); flex-grow: 1; }
            .decl-grid { display: grid; grid-template-columns: 1fr 1fr; margin-top: 30px; gap: 40px; }
            .sig-box { border-top: 2px dashed var(--black); padding-top: 4px; text-align: center; font-weight: 700; font-size: 9pt; white-space: nowrap; }
            .office-footer { display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; padding: 25px 12px 10px 12px; gap: 20px; }
            .office-sig { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 50px; }
            .office-sig-line { width: 100%; border-top: 2px dashed var(--black); padding-top: 4px; font-size: 8pt; font-weight: 800; text-transform: uppercase; }
            .cut-line { border-top: 2px dashed #666; margin: 4px 0; position: relative; width: 100%; }
            .cut-icon { position: absolute; top: -12px; left: 20px; background: white; padding: 0 8px; font-size: 12px; color: #666; font-weight: bold; }
            .student-copy { border: 2px solid var(--border-color); display: flex; flex-direction: column; margin-top: auto; }
            .sc-header { background: var(--green); color: white; text-align: center; font-weight: 800; padding: 4px; font-size: 10pt; text-transform: uppercase; border-bottom: 1px solid var(--border-color); }
            .sc-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; }
            .sc-cell { padding: 5px 10px; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; }
            .sc-full { grid-column: span 3; border-right: none; border-bottom: 1px solid #ccc; padding: 5px 10px; }
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

  const filtered = students.filter(s => s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || s.admissionNo.includes(searchTerm));
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 pb-24">
            
            {/* Modals & Toasts */}
            <ConfirmationModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({...modalConfig, isOpen: false})}
                onConfirm={confirmDelete}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText="Delete"
                isDangerous={true}
            />
            <UndoToast 
                isVisible={toast.visible} 
                message={toast.message} 
                onUndo={handleUndo} 
            />

            {/* Mobile Floating Action Button */}
            <Link to="/dashboard/admission" className="md:hidden fixed bottom-8 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-900/40 flex items-center justify-center z-50 hover:scale-110 transition-transform active:scale-90 border-2 border-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </Link>

            <div className="space-y-8 animate-fade-in-down">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="relative flex-1 w-full max-w-md">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input 
                            type="text" 
                            placeholder="Search by Name, Adm No..." 
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        {selectedIds.size > 0 && (
                            <button 
                                onClick={() => initiateDelete(Array.from(selectedIds))} 
                                className="px-5 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete ({selectedIds.size})
                            </button>
                        )}
                        <Link to="/dashboard/admission" className="hidden md:flex flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 items-center justify-center gap-2 active:scale-95 hover:-translate-y-0.5">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            New Admission
                        </Link>
                    </div>
                </div>

                {/* Select All Toggle */}
                {filtered.length > 0 && (
                    <div className="flex items-center gap-2 px-4">
                        <input 
                            type="checkbox" 
                            id="selectAll"
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedIds.size === filtered.length && filtered.length > 0}
                            onChange={handleSelectAll}
                        />
                        <label htmlFor="selectAll" className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none">Select All</label>
                    </div>
                )}

                {loading ? (
                    <LoadingSkeleton />
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <h3 className="font-bold text-xl text-slate-900">No Records Found</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto">Try adjusting your search or create a new admission record.</p>
                        <Link to="/dashboard/admission" className="inline-block mt-6 px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">Create First Admission</Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                            {paginatedData.map(student => {
                                const isSelected = selectedIds.has(student.id!);
                                return (
                                    <div key={student.id} className={`group bg-white rounded-2xl p-4 border shadow-sm hover:shadow-lg transition-all relative flex flex-col ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-200'}`}>
                                        
                                        {/* Selection Checkbox (Absolute Top Left) */}
                                        <div className="absolute top-3 left-3 z-20" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                checked={isSelected}
                                                onChange={() => handleSelect(student.id!)}
                                            />
                                        </div>

                                        {/* Actions (Top Right - Visible on Hover/Touch) */}
                                        <div className="absolute top-2 right-2 flex gap-1 z-20 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(student); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); initiateDelete([student.id!]); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>

                                        {/* Content Area with Indent for Checkbox */}
                                        <div className="pl-8 pt-1">
                                            
                                            {/* Header: Avatar + Name + Badges */}
                                            <div className="flex items-start gap-3 mb-4">
                                                <div className="shrink-0">
                                                    {student.photo ? (
                                                        <img src={student.photo} className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-50 shadow-sm" alt="" />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100 shadow-sm">
                                                            {student.fullName[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-slate-900 text-base truncate leading-tight mb-1.5">{student.fullName}</h3>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100">Class {student.admissionClass}</span>
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">#{student.admissionNo}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details Grid: Father & Phone */}
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Father's Name</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-700 truncate" title={student.fatherName}>{student.fatherName}</p>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-700 font-mono truncate">{student.phone}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Action */}
                                        <button onClick={() => handlePrint(student)} className="mt-auto w-full py-2.5 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-xs hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group/btn">
                                            <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                            Print Admission Form
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={setCurrentPage} 
                        />
                    </>
                )}
            </div>
        </div>
    </DashboardLayout>
  );
};

export default AdmissionList;
