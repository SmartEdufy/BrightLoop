
import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { SchoolProfile, SchoolType, Student, MASTER_CLASS_LIST } from '../../types';
import { useNavigate, Link } from 'react-router-dom';

// --- TYPES ---
interface ClassRow {
  id: string;
  className: string;
  boys: number;
  girls: number;
}

interface StatementData {
  id?: string;
  schoolId: string;
  month: string;
  year: string;
  refNo: string;
  note: string;
  rows: ClassRow[];
  createdAt: string;
  updatedAt: string;
}

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

// --- LOCAL COMPONENTS ---

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
            Showing Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
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

const StatementSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm h-64 flex flex-col">
        <div className="h-4 w-16 bg-slate-200 rounded mb-2"></div>
        <div className="h-8 w-32 bg-slate-200 rounded mb-6"></div>
        <div className="mt-auto flex gap-2">
           <div className="flex-1 h-20 bg-slate-100 rounded-2xl"></div>
           <div className="flex-1 h-20 bg-slate-100 rounded-2xl"></div>
           <div className="flex-1 h-20 bg-slate-100 rounded-2xl"></div>
        </div>
      </div>
    ))}
  </div>
);

// --- MAIN COMPONENT ---

const RollStatement: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  
  // View State
  const [view, setView] = useState<'list' | 'form'>('list');
  const [formStep, setFormStep] = useState(0); // 0: Setup, 1: Filling, 2: Review
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [statements, setStatements] = useState<StatementData[]>([]);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  
  // Search & Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // Delete / Undo State
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; idsToDelete: string[] }>({ isOpen: false, title: '', message: '', idsToDelete: [] });
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const undoTimerRef = useRef<any>(null);
  const pendingDeletionRef = useRef<{ ids: string[]; records: StatementData[] } | null>(null);
  const isMounted = useRef(true);

  // Form State
  const [formData, setFormData] = useState<StatementData>({
    schoolId: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    refNo: '',
    note: '',
    rows: [],
    createdAt: '',
    updatedAt: ''
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const boysInputRef = useRef<HTMLInputElement>(null);
  const girlsInputRef = useRef<HTMLInputElement>(null);

  // Cleanup Timer
  useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
            commitDelete(true); // Force commit if unmounting with pending delete
        }
    };
  }, []);

  // Auto-scroll navigator and auto-focus
  useEffect(() => {
    if (formStep === 1) {
        // Scroll Navigator
        if (scrollRef.current) {
            const activeBtn = scrollRef.current.children[activeRowIndex] as HTMLElement;
            if (activeBtn) {
                const containerWidth = scrollRef.current.offsetWidth;
                const btnLeft = activeBtn.offsetLeft;
                const btnWidth = activeBtn.offsetWidth;
                scrollRef.current.scrollTo({
                    left: btnLeft - containerWidth / 2 + btnWidth / 2,
                    behavior: 'smooth'
                });
            }
        }
        // Auto-focus Boys Input on class change
        setTimeout(() => {
            boysInputRef.current?.focus();
            boysInputRef.current?.select();
        }, 100);
    }
  }, [activeRowIndex, formStep]);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Load Initial Data
  useEffect(() => {
    if (userProfile?.schoolId) {
      fetchSchoolProfile();
      fetchStatements();
    }
  }, [userProfile?.schoolId, view]);

  const fetchSchoolProfile = async () => {
     if (!userProfile?.schoolId) return;
     if (userProfile.schoolId === 'demo-school') {
        setSchool({
            id: 'demo', name: 'Green Valley International School', udiseCode: 'UDISE-2025',
            zone: 'Central', district: 'Metro City', state: 'California',
            type: SchoolType.MIDDLE, headmasterName: 'Dr. Smith',
            address: '123 Education Lane', ownerUid: 'demo', slug: 'demo',
            websiteConfig: { logoUrl: '' } as any,
            rollStatementClasses: ['10th', '9th', '8th', '7th', '6th', '5th']
        });
        return;
     }
     const docSnap = await getDoc(doc(db, 'schools', userProfile.schoolId));
     if (docSnap.exists()) setSchool(docSnap.data() as SchoolProfile);
  };

  const fetchStatements = async () => {
    if (!userProfile?.schoolId) return;
    setLoading(true);
    
    if (userProfile.schoolId === 'demo-school') {
        setStatements([
            {
                id: 'demo-1', schoolId: 'demo', month: 'April', year: '2025', refNo: 'REF/001',
                note: 'Submitted to ZEO Central.', rows: [
                    { id: '1', className: '10th', boys: 15, girls: 20 },
                    { id: '2', className: '9th', boys: 18, girls: 22 }
                ], createdAt: new Date().toISOString(), updatedAt: ''
            }
        ]);
        setLoading(false);
        return;
    }

    try {
        const q = query(collection(db, 'roll_statements'), where('schoolId', '==', userProfile.schoolId)); 
        const snap = await getDocs(q);
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() } as StatementData));
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (isMounted.current) setStatements(data);
    } catch (e) {
        console.error("Error fetching statements", e);
    } finally {
        if (isMounted.current) setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleCreateNew = async () => {
    if (!school) return;
    setLoading(true);

    const defaultNote = `Submitted in original to the Zonal Education Office ${school.zone || '_______'} for information and necessary action.`;

    let classesToUse: string[] = [];
    if (school.rollStatementClasses && school.rollStatementClasses.length > 0) {
        classesToUse = school.rollStatementClasses;
    } else {
        switch(school.type) {
            case SchoolType.PRIMARY: classesToUse = ['5th', '4th', '3rd', '2nd', '1st', 'UKG', 'LKG', 'Nursery']; break;
            case SchoolType.MIDDLE: classesToUse = ['8th', '7th', '6th', '5th', '4th', '3rd', '2nd', '1st', 'UKG', 'LKG', 'Nursery']; break;
            case SchoolType.SECONDARY: classesToUse = ['10th', '9th', '8th', '7th', '6th', '5th', '4th']; break;
            case SchoolType.HIGHER_SECONDARY: classesToUse = ['12th', '11th', '10th', '9th']; break;
            default: classesToUse = ['5th', '4th', '3rd', '2nd', '1st'];
        }
    }

    // Custom sort based on Master List
    classesToUse.sort((a, b) => MASTER_CLASS_LIST.indexOf(a) - MASTER_CLASS_LIST.indexOf(b));

    // Initialize Rows
    const q = query(collection(db, 'students'), where('schoolId', '==', userProfile?.schoolId));
    let students: Student[] = [];
    if (userProfile?.schoolId !== 'demo-school') {
        const snap = await getDocs(q);
        students = snap.docs.map(d => d.data() as Student);
    }

    const newRows: ClassRow[] = classesToUse.map(cls => {
        const classStudents = students.filter(s => s.class === cls);
        return {
            id: Math.random().toString(36).substr(2, 9),
            className: cls,
            boys: classStudents.filter(s => s.gender === 'Male').length,
            girls: classStudents.filter(s => s.gender === 'Female').length
        };
    });

    setFormData({
        schoolId: userProfile!.schoolId!,
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear().toString(),
        refNo: '',
        note: defaultNote,
        rows: newRows,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    setLoading(false);
    setActiveRowIndex(0);
    setFormStep(0);
    setView('form');
  };

  const handleEdit = (stmt: StatementData) => {
      setFormData(stmt);
      setActiveRowIndex(0);
      setFormStep(0); 
      setView('form');
  };

  // --- SELECTION LOGIC ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedIds(new Set(filteredStatements.map(s => s.id!)));
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

  // --- DELETE / UNDO LOGIC ---
  const initiateDelete = (ids: string[]) => {
      const isBulk = ids.length > 1;
      setModalConfig({
          isOpen: true,
          title: isBulk ? `Delete ${ids.length} Statements?` : 'Delete Statement?',
          message: isBulk 
            ? `Are you sure you want to delete ${ids.length} selected statements? This action can be undone briefly.` 
            : 'Are you sure you want to delete this statement? This action can be undone briefly.',
          idsToDelete: ids
      });
  };

  const confirmDelete = () => {
      const ids = modalConfig.idsToDelete;
      
      if (pendingDeletionRef.current) {
          commitDelete(true);
      }

      const recordsToDelete = statements.filter(s => ids.includes(s.id!));
      pendingDeletionRef.current = { ids, records: recordsToDelete };

      setStatements(prev => prev.filter(s => !ids.includes(s.id!)));
      setSelectedIds(new Set());
      setModalConfig({ ...modalConfig, isOpen: false });

      setToast({ visible: true, message: `${ids.length} Statement(s) deleted` });
      undoTimerRef.current = setTimeout(() => {
          commitDelete();
      }, 4000);
  };

  const commitDelete = async (skipUi = false) => {
      if (isMounted.current && !skipUi) setToast({ visible: false, message: '' });
      undoTimerRef.current = null;

      if (!pendingDeletionRef.current) return;
      const { ids } = pendingDeletionRef.current;
      pendingDeletionRef.current = null;

      if (userProfile?.schoolId === 'demo-school') return;

      try {
          const batch = writeBatch(db);
          ids.forEach(id => {
              const ref = doc(db, 'roll_statements', id);
              batch.delete(ref);
          });
          await batch.commit();
      } catch (e) {
          console.error("Delete failed", e);
          if (isMounted.current && !skipUi) fetchStatements(); // Revert on fail
      }
  };

  const handleUndo = () => {
      if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current);
          undoTimerRef.current = null;
      }
      if (pendingDeletionRef.current) {
          const { records } = pendingDeletionRef.current;
          setStatements(prev => [...prev, ...records].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          pendingDeletionRef.current = null;
          setToast({ visible: false, message: '' });
      }
  };

  const handleSave = async () => {
      if (!userProfile?.schoolId) return;
      if (currentUser?.uid === 'demo-user-123') {
          alert("Demo Saved!");
          setView('list');
          return;
      }
      
      setLoading(true);
      try {
          const payload = { ...formData, updatedAt: new Date().toISOString() };
          if (formData.id) {
              await updateDoc(doc(db, 'roll_statements', formData.id), payload);
          } else {
              await addDoc(collection(db, 'roll_statements'), payload);
          }
          setView('list');
          fetchStatements();
      } catch (e) {
          console.error("Save failed", e);
          alert("Failed to save.");
      } finally {
          setLoading(false);
      }
  };

  // --- NAVIGATION & UPDATE ---

  const goNext = () => {
      if (formStep === 0) {
          if (!formData.month || !formData.year) { alert("Please select month and year"); return; }
          setFormStep(1);
          setActiveRowIndex(0);
      } else if (formStep === 1) {
          if (activeRowIndex < formData.rows.length - 1) {
              setActiveRowIndex(prev => prev + 1);
          } else {
              setFormStep(2);
          }
      }
  };

  const goBack = () => {
      if (formStep === 2) {
          setFormStep(1);
          setActiveRowIndex(formData.rows.length - 1);
      } else if (formStep === 1) {
          if (activeRowIndex > 0) {
              setActiveRowIndex(prev => prev - 1);
          } else {
              setFormStep(0);
          }
      } else if (formStep === 0) {
          setView('list');
      }
  };

  const updateRow = (id: string, field: keyof ClassRow, val: any) => {
      setFormData(prev => ({
          ...prev,
          rows: prev.rows.map(r => r.id === id ? { ...r, [field]: val } : r)
      }));
  };

  const getTotals = () => formData.rows.reduce((acc, r) => ({
      boys: acc.boys + Number(r.boys),
      girls: acc.girls + Number(r.girls),
      total: acc.total + Number(r.boys) + Number(r.girls)
  }), { boys: 0, girls: 0, total: 0 });

  const handlePrint = (data: StatementData = formData) => {
      if (!school) return;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const watermarkText = getWatermarkName(school.name);

      const totals = data.rows.reduce((acc, r) => ({
          boys: acc.boys + Number(r.boys),
          girls: acc.girls + Number(r.girls),
          total: acc.total + Number(r.boys) + Number(r.girls)
      }), { boys: 0, girls: 0, total: 0 });

      const printDate = new Date().toLocaleDateString('en-GB', {
          day: '2-digit', month: '2-digit', year: 'numeric'
      });

      const tableRows = data.rows.map((row, index) => `
        <tr>
            <td style="text-align:center;">${index + 1}</td>
            <td style="padding-left:15px;"><span style="font-weight:bold;">${row.className}</span></td>
            <td style="text-align:center; font-family:'JetBrains Mono';">${row.boys}</td>
            <td style="text-align:center; font-family:'JetBrains Mono';">${row.girls}</td>
            <td style="text-align:center; font-weight:bold; background:#f8fafc;">${Number(row.boys) + Number(row.girls)}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Roll Statement - ${data.month} ${data.year}</title>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
      <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Inter', sans-serif; color: #1f1a16; padding: 20px; position: relative; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-family: 'Playfair Display', serif; font-size: 60px; font-weight: 900; color: #312e81; opacity: 0.06; text-align: center; width: 90%; max-width: 90%; pointer-events: none; z-index: -1; white-space: normal; line-height: 1.2; overflow: hidden; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; border-bottom: 3px double #312e81; margin-bottom: 25px; gap: 40px; position: relative; z-index: 1; background: white; }
        .logo-box { width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border: 2px solid #312e81; border-radius: 12px; color: #312e81; flex-shrink: 0; }
        .school-info { flex: 1; text-align: center; padding: 0 10px; }
        .school-name { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 900; color: #312e81; text-transform: uppercase; margin-bottom: 5px; white-space: nowrap; }
        .school-meta { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #444; }
        .doc-title { text-align: center; background: #1f1a16; color: white; padding: 8px; text-transform: uppercase; font-weight: 800; letter-spacing: 2px; font-size: 14px; margin-bottom: 25px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fdfdfd; position: relative; z-index: 1; }
        .label { font-size: 9px; font-weight: 700; color: #888; text-transform: uppercase; }
        .value { font-size: 13px; font-weight: 800; color: #000; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px; position: relative; z-index: 1; background: transparent; }
        th, td { border: 1px solid #000; padding: 8px 12px; }
        th { background: #f1f5f9; text-transform: uppercase; font-weight: 800; font-size: 10px; }
        .footer-total { background: #eef2ff; color: #312e81; font-weight: 900; font-size: 13px; }
        .footer-total td { border-top: 2px solid #312e81; border-bottom: 2px solid #312e81; }
        .sigs { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 20px; position: relative; z-index: 1; }
        .line { border-top: 2px dashed #000; padding-top: 6px; font-weight: 800; font-size: 11px; text-transform: uppercase; }
      </style></head><body>
        <div class="watermark">${watermarkText}</div>
        <div class="header">
            <div class="logo-box"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
            <div class="school-info">
                <div class="school-name">${school.name}</div>
                <div class="school-meta">Zone: ${school.zone} | District: ${school.district} | UDISE: ${school.udiseCode}</div>
            </div><div style="width:70px"></div>
        </div>
        <div class="doc-title">Roll Statement of Students</div>
        <div class="info-grid">
            <div><span class="label">Month</span><br><span class="value" style="color:#0084C4;">${data.month.toUpperCase()}</span></div>
            <div><span class="label">Ref No.</span><br><span class="value">${data.refNo || '————'}</span></div>
            <div><span class="label">Date</span><br><span class="value">${printDate}</span></div>
        </div>
        <table><thead><tr><th width="10%">S.No.</th><th width="30%">Class</th><th width="20%">Boys</th><th width="20%">Girls</th><th width="20%">Total</th></tr></thead>
        <tbody>${tableRows}<tr class="footer-total"><td colspan="2" style="text-align:right; padding-right: 20px; text-transform:uppercase;">Grand Total</td><td style="text-align:center;">${totals.boys}</td><td style="text-align:center;">${totals.girls}</td><td style="text-align:center;">${totals.total}</td></tr></tbody></table>
        <div style="border: 1px dashed #aaa; padding: 15px; border-radius: 8px; font-size: 11px; margin-bottom: 40px; background: #fafafa; position: relative; z-index: 1;"><strong>Note:</strong><br/>${data.note}</div>
        <div class="sigs"><div style="text-align:center; width:200px;"><div style="height:40px"></div><div class="line">Class Teacher</div></div><div style="text-align:center; width:200px;">${school.signatureUrl ? `<img src="${school.signatureUrl}" style="height:40px; object-fit:contain; margin-bottom:2px;" />` : '<div style="height:40px"></div>'}<div class="line">Headmaster</div></div></div>
        <script>window.onload = () => window.print();</script></body></html>`);
      printWindow.document.close();
  };

  // --- FILTERED DATA ---
  const filteredStatements = statements.filter(s => 
      s.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.year.includes(searchTerm) ||
      s.refNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- PAGINATED DATA ---
  const totalPages = Math.ceil(filteredStatements.length / ITEMS_PER_PAGE);
  const paginatedStatements = filteredStatements.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- RENDER ---

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        
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
        {view === 'list' && (
            <button onClick={handleCreateNew} className="md:hidden fixed bottom-8 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-900/40 flex items-center justify-center z-50 hover:scale-110 transition-transform active:scale-90 border-2 border-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
        )}

        {/* VIEW: LIST */}
        {view === 'list' && (
            <div className="space-y-8 animate-fade-in-down">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="relative flex-1 w-full max-w-md">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input 
                            type="text" 
                            placeholder="Search by Month, Year..." 
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
                        <button onClick={handleCreateNew} className="hidden md:flex flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 items-center justify-center gap-2 active:scale-95 hover:-translate-y-0.5">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Create New
                        </button>
                    </div>
                </div>

                {/* Select All Toggle (Mobile friendly) */}
                {filteredStatements.length > 0 && (
                    <div className="flex items-center gap-2 px-4">
                        <input 
                            type="checkbox" 
                            id="selectAll"
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedIds.size === filteredStatements.length && filteredStatements.length > 0}
                            onChange={handleSelectAll}
                        />
                        <label htmlFor="selectAll" className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none">Select All</label>
                    </div>
                )}

                {loading ? (
                    <StatementSkeleton />
                ) : filteredStatements.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <h3 className="font-bold text-xl text-slate-900">No Statements Found</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto">Try adjusting your search or create a new roll statement.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedStatements.map(stmt => {
                                const stats = stmt.rows.reduce((acc, r) => ({ b: acc.b + Number(r.boys), g: acc.g + Number(r.girls) }), { b: 0, g: 0 });
                                const isSelected = selectedIds.has(stmt.id!);
                                return (
                                    <div key={stmt.id} className={`group bg-white rounded-2xl p-4 border shadow-sm hover:shadow-xl transition-all relative ${isSelected ? 'border-indigo-300 ring-2 ring-indigo-500/20 bg-indigo-50/30' : 'border-slate-100 hover:shadow-indigo-500/10'}`}>
                                        
                                        {/* Checkbox */}
                                        <div className="absolute top-0 left-0 p-4 z-10 cursor-pointer" onClick={() => handleSelect(stmt.id!)}>
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                                                checked={isSelected}
                                                readOnly
                                            />
                                        </div>

                                        <div className="absolute top-3 right-3 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(stmt)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                            <button onClick={() => initiateDelete([stmt.id!])} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </div>
                                        
                                        <div className="mb-4 md:mb-6 pl-8 mt-2">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stmt.year}</p>
                                            <h3 className="text-xl md:text-2xl font-bold text-slate-900 font-display">{stmt.month}</h3>
                                            <span className={`inline-block mt-2 px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${stmt.refNo ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{stmt.refNo || 'Draft'}</span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex-1 bg-blue-50 text-blue-700 px-2 py-2 rounded-xl text-center"><div className="text-[10px] font-bold uppercase opacity-60">Boys</div><div className="font-bold text-base md:text-lg font-mono">{stats.b}</div></div>
                                            <div className="flex-1 bg-pink-50 text-pink-700 px-2 py-2 rounded-xl text-center"><div className="text-[10px] font-bold uppercase opacity-60">Girls</div><div className="font-bold text-base md:text-lg font-mono">{stats.g}</div></div>
                                            <div className="flex-1 bg-slate-100 text-slate-700 px-2 py-2 rounded-xl text-center"><div className="text-[10px] font-bold uppercase opacity-60">Total</div><div className="font-bold text-base md:text-lg font-mono">{stats.b + stats.g}</div></div>
                                        </div>

                                        <button onClick={() => handlePrint(stmt)} className="w-full py-2.5 md:py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-xs md:text-sm hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                            Print Report
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
        )}

        {/* VIEW: FORM (Step 0, 1, 2 logic) */}
        {view === 'form' && (
            <div className="animate-fade-in-down">
                {/* Stepper */}
                <div className="flex items-center justify-center mb-8">
                    {['Setup', 'Data Entry', 'Review'].map((label, i) => (
                        <React.Fragment key={i}>
                            <div className={`flex flex-col items-center transition-all duration-300 ${formStep === i ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-1 ${formStep >= i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</div>
                                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                            </div>
                            {i < 2 && <div className={`w-12 h-1 mx-2 rounded-full ${formStep > i ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>}
                        </React.Fragment>
                    ))}
                </div>

                {/* STEP 0: SETUP */}
                {formStep === 0 && (
                    <div className="max-w-md mx-auto bg-white rounded-[2.5rem] p-8 shadow-xl shadow-indigo-500/5 border border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8 font-display">Statement Details</h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Month</label>
                                <div className="relative">
                                    <select value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-800 appearance-none transition-all">
                                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Year</label>
                                    <input type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Ref No.</label>
                                    <input type="text" value={formData.refNo} onChange={e => setFormData({...formData, refNo: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" placeholder="Optional" />
                                </div>
                            </div>
                            
                            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <div className="text-slate-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg></div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Configuration</p>
                                    <Link to="/dashboard/school/settings" className="text-xs font-bold text-indigo-600 hover:underline">Manage Classes &rarr;</Link>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setView('list')} className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button onClick={goNext} className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">Start Filling &rarr;</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 1: DATA ENTRY */}
                {formStep === 1 && (
                    <div className="max-w-md mx-auto">
                        {/* Horizontal Class Navigator */}
                        <div className="sticky top-20 z-30 -mx-4 px-4 md:mx-0 md:px-0 mb-6 bg-slate-50/95 backdrop-blur-sm py-2 md:bg-transparent">
                            <div className="flex gap-2 overflow-x-auto py-2 hide-scrollbar snap-x" ref={scrollRef}>
                                {formData.rows.map((row, idx) => {
                                    const isFilled = row.boys > 0 || row.girls > 0;
                                    const isActive = idx === activeRowIndex;
                                    return (
                                        <button 
                                            key={row.id} 
                                            onClick={() => setActiveRowIndex(idx)}
                                            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all snap-center border shadow-sm ${isActive ? 'bg-indigo-600 text-white border-indigo-600 scale-105 shadow-indigo-500/30' : isFilled ? 'bg-white text-emerald-600 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'}`}
                                        >
                                            {row.className} {isFilled && !isActive && '✓'}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Main Input Card */}
                        <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-500/10 border border-slate-100 overflow-hidden relative">
                            <div className="p-6">
                                {/* Integrated Header */}
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Class {activeRowIndex + 1}/{formData.rows.length}</span>
                                        <h2 className="text-3xl font-bold text-slate-900 font-display leading-none mt-1">{formData.rows[activeRowIndex].className}</h2>
                                    </div>
                                    <div className="text-right bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Strength</span>
                                        <span className="text-2xl font-bold text-indigo-600 font-mono leading-none">{Number(formData.rows[activeRowIndex].boys) + Number(formData.rows[activeRowIndex].girls)}</span>
                                    </div>
                                </div>

                                {/* Compact Input Grid (2 Cols) */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Boys */}
                                    <div className="space-y-1.5">
                                        <label className="block text-center text-[10px] font-bold text-blue-500 uppercase tracking-wider">Boys</label>
                                        <div className="flex items-center bg-blue-50 rounded-xl p-1 border-2 border-blue-100 focus-within:border-blue-400 transition-colors h-14">
                                            <button tabIndex={-1} onClick={() => updateRow(formData.rows[activeRowIndex].id, 'boys', Math.max(0, Number(formData.rows[activeRowIndex].boys) - 1))} className="w-8 h-full rounded-lg bg-white text-blue-600 shadow-sm font-bold text-lg hover:bg-blue-50 transition-colors flex-shrink-0">-</button>
                                            <input 
                                                ref={boysInputRef}
                                                type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off"
                                                value={formData.rows[activeRowIndex].boys}
                                                onChange={e => updateRow(formData.rows[activeRowIndex].id, 'boys', parseInt(e.target.value.replace(/\D/g,'')) || 0)}
                                                onFocus={e => e.target.select()}
                                                className="flex-1 min-w-0 w-full bg-transparent text-center font-mono text-xl font-bold text-blue-900 outline-none h-full"
                                                onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); girlsInputRef.current?.focus(); girlsInputRef.current?.select(); } }}
                                                enterKeyHint="next"
                                            />
                                            <button tabIndex={-1} onClick={() => updateRow(formData.rows[activeRowIndex].id, 'boys', Number(formData.rows[activeRowIndex].boys) + 1)} className="w-8 h-full rounded-lg bg-blue-500 text-white shadow-sm shadow-blue-500/30 font-bold text-lg hover:bg-blue-600 transition-colors flex-shrink-0">+</button>
                                        </div>
                                    </div>

                                    {/* Girls */}
                                    <div className="space-y-1.5">
                                        <label className="block text-center text-[10px] font-bold text-pink-500 uppercase tracking-wider">Girls</label>
                                        <div className="flex items-center bg-pink-50 rounded-xl p-1 border-2 border-pink-100 focus-within:border-pink-400 transition-colors h-14">
                                            <button tabIndex={-1} onClick={() => updateRow(formData.rows[activeRowIndex].id, 'girls', Math.max(0, Number(formData.rows[activeRowIndex].girls) - 1))} className="w-8 h-full rounded-lg bg-white text-pink-600 shadow-sm font-bold text-lg hover:bg-pink-50 transition-colors flex-shrink-0">-</button>
                                            <input 
                                                ref={girlsInputRef}
                                                type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off"
                                                value={formData.rows[activeRowIndex].girls}
                                                onChange={e => updateRow(formData.rows[activeRowIndex].id, 'girls', parseInt(e.target.value.replace(/\D/g,'')) || 0)}
                                                onFocus={e => e.target.select()}
                                                className="flex-1 min-w-0 w-full bg-transparent text-center font-mono text-xl font-bold text-pink-900 outline-none h-full"
                                                onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); goNext(); } }}
                                                enterKeyHint={activeRowIndex === formData.rows.length - 1 ? "done" : "next"}
                                            />
                                            <button tabIndex={-1} onClick={() => updateRow(formData.rows[activeRowIndex].id, 'girls', Number(formData.rows[activeRowIndex].girls) + 1)} className="w-8 h-full rounded-lg bg-pink-500 text-white shadow-sm shadow-pink-500/30 font-bold text-lg hover:bg-pink-600 transition-colors flex-shrink-0">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Navigation */}
                        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-40 flex gap-4 md:static md:bg-transparent md:border-none md:p-0 md:mt-8 safe-area-pb">
                            <button onClick={goBack} className="flex-1 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Prev</button>
                            <button onClick={goNext} className="flex-[2] py-4 rounded-2xl font-bold text-white bg-slate-900 shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2">
                                {activeRowIndex === formData.rows.length - 1 ? 'Finish & Review' : 'Next Class'} 
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </button>
                        </div>
                        {/* Spacer for mobile safe area */}
                        <div className="h-24 md:hidden"></div>
                    </div>
                )}

                {/* STEP 2: REVIEW */}
                {formStep === 2 && (
                    <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h2 className="text-2xl font-bold text-slate-900 font-display">Review Statement</h2>
                            <div className="flex gap-2">
                                <button onClick={goBack} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Back</button>
                                <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5">{loading ? 'Saving...' : 'Submit Statement'}</button>
                            </div>
                        </div>
                        
                        <div className="p-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="bg-blue-50 p-4 rounded-2xl text-center border border-blue-100">
                                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Boys</div>
                                    <div className="text-2xl font-bold text-blue-700 font-mono mt-1">{getTotals().boys}</div>
                                </div>
                                <div className="bg-pink-50 p-4 rounded-2xl text-center border border-pink-100">
                                    <div className="text-xs font-bold text-pink-400 uppercase tracking-wider">Girls</div>
                                    <div className="text-2xl font-bold text-pink-700 font-mono mt-1">{getTotals().girls}</div>
                                </div>
                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-2xl text-center text-white shadow-lg shadow-slate-900/20">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</div>
                                    <div className="text-2xl font-bold text-white font-mono mt-1">{getTotals().total}</div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4">Class</th>
                                            <th className="px-6 py-4 text-center">Boys</th>
                                            <th className="px-6 py-4 text-center">Girls</th>
                                            <th className="px-6 py-4 text-center">Total</th>
                                            <th className="px-6 py-4 text-right">Edit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {formData.rows.map((row, idx) => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-700">{row.className}</td>
                                                <td className="px-6 py-4 text-center font-mono text-blue-600 font-bold">{row.boys}</td>
                                                <td className="px-6 py-4 text-center font-mono text-pink-600 font-bold">{row.girls}</td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-800">{Number(row.boys) + Number(row.girls)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => { setFormStep(1); setActiveRowIndex(idx); }} className="text-indigo-500 hover:text-indigo-700 font-bold text-xs">Edit</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-8">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Additional Note</label>
                                <textarea 
                                    value={formData.note} 
                                    onChange={e => setFormData({...formData, note: e.target.value})}
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none text-sm font-medium transition-all"
                                    rows={3}
                                    placeholder="Any remarks for the zonal office..."
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RollStatement;
