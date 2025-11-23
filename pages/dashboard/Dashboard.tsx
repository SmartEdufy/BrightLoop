
import React, { useEffect, useState, useMemo, useCallback, useDeferredValue, memo } from 'react';
import { DashboardLayout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { UserRole, UserProfile, SchoolProfile, SchoolType, FirestoreTimestamp } from '../../types';
import { db } from '../../services/firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

// --- Reusable UI Components & Hooks ---

const useToast = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; id: number } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, id: Date.now() });
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  return { toast, showToast };
};

const Toast: React.FC<{ toast: { message: string; type: 'success' | 'error' } | null }> = ({ toast }) => {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const bgColor = isSuccess ? 'bg-emerald-500' : 'bg-red-500';
  const icon = isSuccess ? (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ) : (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
  );

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[101] animate-fade-in-down w-full max-w-md px-4">
      <div className={`flex items-center gap-3 text-white text-sm font-bold px-5 py-3.5 rounded-2xl shadow-2xl shadow-slate-900/20 backdrop-blur-md ${bgColor}`}>
        <div className="shrink-0">{icon}</div>
        <span>{toast.message}</span>
      </div>
    </div>
  );
};

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 sm:px-6 bg-white rounded-b-[2rem]">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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

const COLORS = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', ring: 'ring-indigo-500/20', glow: 'bg-indigo-500/10' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', ring: 'ring-amber-500/20', glow: 'bg-amber-500/10' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', ring: 'ring-emerald-500/20', glow: 'bg-emerald-500/10' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', ring: 'ring-sky-500/20', glow: 'bg-sky-500/10' },
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: keyof typeof COLORS }> = memo(({ title, value, icon, color }) => {
  const theme = COLORS[color];
  return (
    <div className="group bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4 relative z-10">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.bg} ${theme.text} ${theme.border} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-bold text-slate-900 font-display tracking-tight">{value}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</p>
      </div>
      
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl transition-colors opacity-50 ${theme.glow}`}></div>
    </div>
  );
});

const SearchInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string }> = memo(({ value, onChange, placeholder }) => (
  <div className="relative w-full max-w-sm group transition-all duration-300 focus-within:max-w-md">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    </div>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-sm shadow-sm hover:border-indigo-200"
    />
  </div>
));

const ConfirmationModal: React.FC<{
  isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; confirmText: string; children: React.ReactNode;
}> = ({ isOpen, onClose, onConfirm, title, confirmText, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in-down" style={{animationDuration: '0.2s'}}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all scale-100">
        <div className="p-8">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-red-500 ring-4 ring-red-50">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-display">{title}</h3>
          <div className="mt-3 text-sm text-slate-500 leading-relaxed">{children}</div>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-200 text-sm">Cancel</button>
          <button onClick={onConfirm} className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 hover:-translate-y-0.5 text-sm">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

// --- Helper Functions ---
const formatDateFromTimestamp = (timestamp: FirestoreTimestamp | Date | undefined): Date => {
    if (!timestamp) return new Date(0);
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp.seconds * 1000);
};

// --- Main Dashboard Component ---

const Dashboard: React.FC = () => {
    const { userProfile, currentUser, loading: authLoading, refreshProfile } = useAuth();
    const [showConnectionError, setShowConnectionError] = useState(false);

    useEffect(() => {
        let timer: any;
        // If authentication is done but user profile is missing, start a timer
        if (!authLoading && currentUser && !userProfile) {
            timer = setTimeout(() => {
                setShowConnectionError(true);
            }, 5000); // 5 seconds delay before confirming it's an error
        } else {
            // If condition is no longer met (e.g. profile loaded), reset state
            setShowConnectionError(false);
        }
        return () => clearTimeout(timer);
    }, [authLoading, currentUser, userProfile]);
    
    // Handle Profile Loading / Error States
    if (currentUser && !userProfile) {
        // Show loading skeleton if we are technically loading OR waiting for the error grace period to expire
        if (authLoading || !showConnectionError) {
            // Still verifying auth or loading profile
            return (
                <DashboardLayout>
                    <div className="animate-pulse space-y-8 max-w-7xl mx-auto">
                        <div className="h-32 bg-slate-200 rounded-3xl w-full"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="h-48 bg-slate-200 rounded-3xl"></div>
                            <div className="h-48 bg-slate-200 rounded-3xl"></div>
                            <div className="h-48 bg-slate-200 rounded-3xl"></div>
                        </div>
                    </div>
                </DashboardLayout>
            );
        } else {
            // Auth checked, grace period over, profile still failed to load
            return (
                <DashboardLayout>
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in-down">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-red-500/10 ring-1 ring-red-100">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 font-display">Connection Error</h2>
                        <p className="text-slate-500 mt-2 max-w-md leading-relaxed">
                            We couldn't load your school profile from the server. This usually happens due to an unstable internet connection.
                        </p>
                        <button 
                            onClick={() => refreshProfile()}
                            className="mt-8 px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Retry Connection
                        </button>
                    </div>
                </DashboardLayout>
            );
        }
    }

    if (userProfile && !userProfile.isApproved) {
        return (
          <DashboardLayout>
            <div className="text-center py-20 max-w-lg mx-auto animate-fade-in-down">
               <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-amber-50/50 shadow-xl shadow-amber-500/20">
                 <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <h2 className="text-3xl font-bold text-slate-900 font-display">Approval Pending</h2>
               <p className="text-slate-600 mt-4 text-lg leading-relaxed">
                 Your account has been created successfully. Our admin team is reviewing your application. You will receive access once verified.
               </p>
               <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-500 font-medium">
                  Account Reference: <span className="font-mono text-slate-700 select-all">{currentUser?.uid}</span>
               </div>
            </div>
          </DashboardLayout>
        )
    }

    if (userProfile?.role === UserRole.ADMIN) {
        return <SuperAdminDashboard />;
    }
  
    const ModuleCard: React.FC<{ title: string; icon: React.ReactNode; to: string; colorClass: string; iconBg: string }> = ({ title, icon, to, colorClass, iconBg }) => (
      <Link to={to} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group hover:-translate-y-1 flex flex-col h-full relative overflow-hidden">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${iconBg} ${colorClass} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 font-display group-hover:text-indigo-600 transition-colors mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">Manage {title.toLowerCase()} and related records.</p>
        
        <div className="mt-auto pt-6 flex items-center text-sm font-bold text-slate-300 group-hover:text-indigo-500 transition-colors">
           <span>Access Module</span>
           <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </div>
      </Link>
    );
  
    return (
      <DashboardLayout>
        <div className="space-y-8 max-w-7xl mx-auto">
          <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-indigo-500/20 ring-1 ring-white/10">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-indigo-600/30 via-violet-600/10 to-transparent"></div>
            
            <div className="relative z-10 max-w-2xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold uppercase tracking-widest mb-6 border border-white/10 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span> School Dashboard
               </div>
               <h1 className="text-3xl md:text-5xl font-bold text-white font-display mb-6 tracking-tight leading-tight">
                 Welcome back, Principal.
               </h1>
               <p className="text-indigo-100 text-base md:text-lg leading-relaxed opacity-90 max-w-lg">
                 Your school's digital command center is ready. Check the latest stats, manage students, and update your website.
               </p>
               <div className="flex flex-wrap gap-4 mt-10">
                  {userProfile?.schoolId ? (
                    <Link to={`/s/${userProfile.schoolId}`} target="_blank" className="px-6 py-3.5 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg shadow-white/10 hover:shadow-white/20 hover:-translate-y-0.5 flex items-center gap-2 group text-sm">
                      Visit Live Website
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </Link>
                  ) : (
                     <Link to="/dashboard/school/setup" className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2 text-sm">
                      Setup School Profile
                    </Link>
                  )}
               </div>
            </div>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <ModuleCard title="School Profile" to="/dashboard/school/setup" icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} colorClass="text-violet-600" iconBg="bg-violet-50" />
             <ModuleCard title="Website Settings" to="/dashboard/settings/website" icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>} colorClass="text-blue-600" iconBg="bg-blue-50" />
             <ModuleCard title="Students Database" to="/dashboard/database/students" icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} colorClass="text-emerald-600" iconBg="bg-emerald-50" />
             <ModuleCard title="Admissions" to="/dashboard/admission/list" icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} colorClass="text-amber-600" iconBg="bg-amber-50" />
          </div>
        </div>
      </DashboardLayout>
    );
};
// ... rest of the file (SuperAdminDashboard and Tab Components) remains unchanged ...
// --- SUPER ADMIN SUB-COMPONENT ---
const SuperAdminDashboard: React.FC = () => {
    const { toast, showToast } = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ totalUsers: 0, totalSchools: 0, pendingApprovals: 0, avgRegsPerDay: '0.0' });
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [allSchools, setAllSchools] = useState<SchoolProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [userSearch, setUserSearch] = useState('');
    const deferredUserSearch = useDeferredValue(userSearch);
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [userStatusFilter, setUserStatusFilter] = useState('all');
    
    const [schoolSearch, setSchoolSearch] = useState('');
    const deferredSchoolSearch = useDeferredValue(schoolSearch);
  
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', confirmText: 'Confirm', onConfirm: () => {} });
    const [editSchoolModal, setEditSchoolModal] = useState<{ isOpen: boolean; school: SchoolProfile | null }>({ isOpen: false, school: null });

    const fetchAllAdminData = useCallback(async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setRefreshing(true);
      try {
        const [usersSnap, schoolsSnap] = await Promise.all([
          getDocs(query(collection(db, "users"))),
          getDocs(query(collection(db, "schools"))),
        ]);
  
        const users = usersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
        const schoolsData = schoolsSnap.docs.map(doc => doc.data() as SchoolProfile);
        
        schoolsData.sort((a, b) => formatDateFromTimestamp(b.createdAt).getTime() - formatDateFromTimestamp(a.createdAt).getTime());

        setAllUsers(users);
        setAllSchools(schoolsData);
  
        const registrationDates = schoolsData.map(s => formatDateFromTimestamp(s.createdAt)).filter(d => d.getTime() > 0);
        const avgRegsPerDay = registrationDates.length > 1 
          ? (registrationDates.length / ((new Date().getTime() - registrationDates[registrationDates.length - 1].getTime()) / (1000 * 3600 * 24))).toFixed(1)
          : registrationDates.length.toFixed(1);
  
        setStats({
          totalUsers: users.length,
          totalSchools: schoolsData.length,
          pendingApprovals: users.filter(u => !u.isApproved).length,
          avgRegsPerDay,
        });
        
        if(!showLoading) showToast("Data synced successfully", "success");
  
      } catch (error: any) {
        showToast("Failed to load dashboard data.", 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [showToast]);
  
    useEffect(() => { fetchAllAdminData(); }, [fetchAllAdminData]);

    const handleUpdateUser = useCallback(async (uid: string, data: Partial<UserProfile>) => {
      if (!uid) return;
      setActiveDropdown(null);
      try {
        await updateDoc(doc(db, "users", uid), data);
        await fetchAllAdminData(false);
        showToast('User updated successfully!', 'success');
      } catch (error: any) { showToast(`Update failed: ${error.message}`, 'error'); } 
    }, [fetchAllAdminData, showToast]);
  
    const handleDeleteUser = useCallback(async (uid: string) => {
        if (!uid) return;
        setActiveDropdown(null);
        setModalState(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, "users", uid));
          await fetchAllAdminData(false);
          showToast('User deleted successfully!', 'success');
        } catch (error: any) { showToast(`Deletion failed: ${error.message}`, 'error'); }
    }, [fetchAllAdminData, showToast]);

    const handleDeleteSchool = useCallback(async (schoolId: string) => {
      if (!schoolId) return;
      setModalState(prev => ({ ...prev, isOpen: false }));
      try {
        await deleteDoc(doc(db, "schools", schoolId));
        await fetchAllAdminData(false);
        showToast('School deleted successfully!', 'success');
      } catch (error: any) { showToast(`Deletion failed: ${error.message}`, 'error'); }
    }, [fetchAllAdminData, showToast]);

    const handleUpdateSchool = useCallback(async (school: SchoolProfile) => {
        try {
            await setDoc(doc(db, 'schools', school.id), school, { merge: true });
            await fetchAllAdminData(false);
            showToast('School updated successfully!', 'success');
            setEditSchoolModal({ isOpen: false, school: null });
        } catch(e: any) {
            showToast(`Update failed: ${e.message}`, 'error');
        }
    }, [fetchAllAdminData, showToast]);
  
    const openModal = useCallback((config: { title: string; message: string; confirmText: string; onConfirm: () => void; }) => {
        setModalState({ isOpen: true, ...config });
        setActiveDropdown(null);
    }, []);

    const filteredUsers = useMemo(() => 
      allUsers
        .filter(u => u.email.toLowerCase().includes(deferredUserSearch.toLowerCase()))
        .filter(u => userRoleFilter === 'all' || u.role === userRoleFilter)
        .filter(u => userStatusFilter === 'all' || u.isApproved.toString() === userStatusFilter)
    , [allUsers, deferredUserSearch, userRoleFilter, userStatusFilter]);
    
    const filteredSchools = useMemo(() => 
      allSchools.filter(s => s.name.toLowerCase().includes(deferredSchoolSearch.toLowerCase()))
    , [allSchools, deferredSchoolSearch]);

  
    if (loading) return <DashboardLayout><div className="animate-pulse p-4 space-y-4"><div className="h-20 bg-slate-200 rounded-xl"></div><div className="h-64 bg-slate-200 rounded-xl"></div></div></DashboardLayout>;

    const renderContent = () => {
        switch (activeTab) {
            case 'users': return <UserManagementTab {...{ filteredUsers, openModal, handleUpdateUser, handleDeleteUser, activeDropdown, setActiveDropdown, userSearch, setUserSearch, userRoleFilter, setUserRoleFilter, userStatusFilter, setUserStatusFilter }} />;
            case 'schools': return <SchoolManagementTab {...{ filteredSchools, schoolSearch, setSchoolSearch, setEditSchoolModal, openModal, handleDeleteSchool }} />;
            case 'settings': return <SettingsTab showToast={showToast} />;
            default: return <OverviewTab {...{ stats, allSchools, allUsers }} />;
        }
    };
  
    return (
        <DashboardLayout>
            <Toast toast={toast} />
            <ConfirmationModal isOpen={modalState.isOpen} onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))} {...modalState} />
            {editSchoolModal.isOpen && editSchoolModal.school && (
                <EditSchoolModal 
                    school={editSchoolModal.school}
                    onClose={() => setEditSchoolModal({ isOpen: false, school: null })}
                    onSave={handleUpdateSchool}
                />
            )}

            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 font-display tracking-tight">Command Center</h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <p className="text-sm font-medium text-slate-500">Operational | {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                         <button onClick={() => fetchAllAdminData(false)} className={`p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all ${refreshing ? 'animate-spin' : ''}`} title="Sync Data">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                         </button>
                         <div className="bg-slate-100 p-1 rounded-xl flex flex-1 md:flex-none overflow-x-auto hide-scrollbar">
                            {['overview', 'users', 'schools', 'settings'].map((tab) => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap flex-1 md:flex-none ${
                                        activeTab === tab 
                                        ? 'bg-white text-slate-900 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    } capitalize`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="animate-fade-in-down" key={activeTab}>
                    {renderContent()}
                </div>
            </div>
        </DashboardLayout>
    );
};

// --- TAB COMPONENTS ---

const OverviewTab: React.FC<any> = memo(({ stats, allSchools, allUsers }) => (
    <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Schools" value={stats.totalSchools.toString()} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} color="indigo" />
            <StatCard title="Pending Approvals" value={stats.pendingApprovals.toString()} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="amber" />
            <StatCard title="Total Users" value={stats.totalUsers.toString()} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} color="emerald" />
            <StatCard title="Avg. Regs / Day" value={stats.avgRegsPerDay} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} color="sky" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm h-full">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-slate-900 font-display">Recent Activity</h3>
                    <span className="text-xs font-medium text-slate-400">Live Feed</span>
                </div>
                <div className="space-y-6">
                    {allSchools.slice(0, 3).map((s:any, i:number) => (
                         <div key={s.id} className="flex items-start gap-4 group">
                             <div className="relative">
                                 <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 z-10 relative">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                 </div>
                                 {i !== 2 && <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-slate-100"></div>}
                             </div>
                             <div>
                                 <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">New School Registered</p>
                                 <p className="text-sm text-slate-500 mt-0.5">{s.name} has joined from {s.district}.</p>
                                 <p className="text-xs text-slate-400 mt-1">{formatDateFromTimestamp(s.createdAt).toLocaleDateString()}</p>
                             </div>
                         </div>
                    ))}
                    {allSchools.length === 0 && <p className="text-slate-400 italic text-sm">No recent activity.</p>}
                </div>
             </div>
             
             <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 font-display mb-6">Recent Users</h3>
                <div className="space-y-4">
                    {allUsers.slice(0, 5).map((u:any) => (
                        <div key={u.uid} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-default group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">{u.email[0].toUpperCase()}</div>
                                <div className="truncate">
                                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-slate-900">{u.email}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{u.role}</p>
                                </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${u.isApproved ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                        </div>
                    ))}
                </div>
             </div>
        </div>
    </div>
));

const UserManagementTab: React.FC<any> = memo(({ filteredUsers, openModal, handleUpdateUser, handleDeleteUser, activeDropdown, setActiveDropdown, userSearch, setUserSearch, userRoleFilter, setUserRoleFilter, userStatusFilter, setUserStatusFilter }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Reset page on filter change
    useEffect(() => setCurrentPage(1), [userSearch, userRoleFilter, userStatusFilter]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (activeDropdown) setActiveDropdown(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeDropdown, setActiveDropdown]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    const UserActionDropdown = ({ user }: { user: UserProfile }) => (
        <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl shadow-slate-900/20 border border-slate-100 z-[100] overflow-hidden animate-fade-in-down origin-top-right">
            <div className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 bg-slate-50/50">User Actions</div>
            <div className="p-1.5 space-y-0.5">
                {!user.isApproved && (
                    <button onClick={() => handleUpdateUser(user.uid, { isApproved: true })} className="w-full text-left px-3 py-2.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg font-bold flex items-center gap-2.5 transition-colors">
                        <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center shrink-0"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div> 
                        Approve Account
                    </button>
                )}
                {user.isApproved && (
                    <button onClick={() => handleUpdateUser(user.uid, { isApproved: false })} className="w-full text-left px-3 py-2.5 text-xs text-amber-600 hover:bg-amber-50 rounded-lg font-bold flex items-center gap-2.5 transition-colors">
                        <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center shrink-0"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                        Suspend Access
                    </button>
                )}
                <button onClick={() => openModal({ title: 'Delete User', message: 'Are you sure you want to delete this user? This action cannot be undone.', confirmText: 'Delete', onConfirm: () => handleDeleteUser(user.uid) })} className="w-full text-left px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-bold flex items-center gap-2.5 transition-colors">
                    <div className="w-5 h-5 rounded bg-red-100 flex items-center justify-center shrink-0"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
                    Delete User
                </button>
            </div>
        </div>
    );

    return (
    <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-[2rem] border border-slate-200 shadow-sm">
             <div className="flex-1 flex flex-col md:flex-row items-center gap-4 w-full">
                <SearchInput value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users by email..." />
                <div className="hidden md:flex bg-slate-100 p-1 rounded-xl shrink-0">
                    {['all', 'ADMIN', 'SCHOOL_ADMIN'].map(role => (
                        <button 
                            key={role} 
                            onClick={() => setUserRoleFilter(role)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${userRoleFilter === role ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {role === 'all' ? 'All' : role.replace('_', ' ')}
                        </button>
                    ))}
                </div>
             </div>
             
             <div className="flex items-center gap-3 w-full md:w-auto">
                <select value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium appearance-none cursor-pointer hover:bg-slate-100 transition-colors w-full md:w-auto">
                    <option value="all">All Status</option>
                    <option value="true">Active Users</option>
                    <option value="false">Pending Approval</option>
                </select>
             </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-visible">
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                            <th className="px-8 py-6">User Identity</th>
                            <th className="px-8 py-6">Role & Status</th>
                            <th className="px-8 py-6">Assigned School</th>
                            <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedUsers.map((user: UserProfile) => (
                            <tr key={user.uid} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{user.email}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{user.uid.substring(0, 8)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${user.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                            {user.role === UserRole.ADMIN ? 'SUPER ADMIN' : 'SCHOOL ADMIN'}
                                        </span>
                                        <span className={`text-xs font-bold ${user.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>{user.isApproved ? 'Active' : 'Pending'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-4 text-sm text-slate-600">
                                    {user.schoolId || <span className="text-slate-400 italic">Unassigned</span>}
                                </td>
                                <td className="px-8 py-4 text-right relative">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === user.uid ? null : user.uid); }} className={`p-2 rounded-lg transition-all ${activeDropdown === user.uid ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                    </button>
                                    {activeDropdown === user.uid && <UserActionDropdown user={user} />}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MOBILE CARD VIEW (Optimized for Z-Index) */}
            <div className="md:hidden p-4 space-y-4 bg-slate-50">
                {paginatedUsers.map((user: UserProfile) => {
                    const isActive = activeDropdown === user.uid;
                    return (
                        <div key={user.uid} className={`bg-white rounded-2xl border shadow-sm p-4 transition-all duration-200 ${isActive ? 'relative z-20 border-indigo-200 ring-2 ring-indigo-500/20 shadow-lg scale-[1.02]' : 'relative z-0 border-slate-200'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold border border-slate-200 shrink-0">
                                        {user.email[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-slate-900 truncate pr-2">{user.email}</div>
                                        <div className="text-[10px] text-slate-400 font-mono bg-slate-50 inline-block px-1.5 rounded">{user.uid.substring(0, 8)}...</div>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(isActive ? null : user.uid); }} className={`p-2 -mr-2 -mt-2 rounded-full transition-colors ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 active:bg-slate-100'}`}>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                    </button>
                                    {isActive && <UserActionDropdown user={user} />}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role</span>
                                    <span className="font-bold text-slate-700">{user.role === UserRole.ADMIN ? 'Super Admin' : 'School Admin'}</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</span>
                                    <span className={`font-bold ${user.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>{user.isApproved ? 'Verified' : 'Pending'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredUsers.length > 0 ? (
                 <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            ) : (
                <div className="p-12 text-center text-slate-400 italic">No users found matching criteria.</div>
            )}
        </div>
    </div>
    );
});

const SchoolManagementTab: React.FC<any> = memo(({ filteredSchools, schoolSearch, setSchoolSearch, setEditSchoolModal, openModal, handleDeleteSchool }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9; // Grid of 3x3

    useEffect(() => setCurrentPage(1), [schoolSearch]);

    const paginatedSchools = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSchools.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredSchools, currentPage]);

    const totalPages = Math.ceil(filteredSchools.length / ITEMS_PER_PAGE);

    return (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 md:p-5 rounded-[2rem] border border-slate-200 shadow-sm">
            <SearchInput value={schoolSearch} onChange={e => setSchoolSearch(e.target.value)} placeholder="Search schools..." />
             <div className="hidden md:block text-sm text-slate-500 font-medium">
                <span className="text-slate-900 font-bold">{filteredSchools.length}</span> Registered
             </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedSchools.map((school: SchoolProfile) => (
                <div key={school.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group flex flex-col hover:-translate-y-1">
                    <div className="h-36 bg-slate-100 relative overflow-hidden">
                        {school.websiteConfig.heroImageUrl ? (
                            <img src={school.websiteConfig.heroImageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={school.name} loading="lazy" />
                        ) : (
                            <div className={`w-full h-full bg-gradient-to-br from-${school.websiteConfig.themeColor || 'indigo'}-500 to-${school.websiteConfig.themeColor || 'indigo'}-700`}></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-4 left-5 right-5">
                            <h3 className="text-lg font-bold text-white font-display leading-tight truncate shadow-sm">{school.name}</h3>
                            <p className="text-white/90 text-xs mt-1 flex items-center gap-1 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {school.district}
                            </p>
                        </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md uppercase tracking-wider">{school.type}</span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">{school.udiseCode}</span>
                        </div>
                        
                        <div className="mt-auto grid grid-cols-2 gap-3">
                             <button onClick={() => setEditSchoolModal({ isOpen: true, school })} className="px-3 py-2.5 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl hover:bg-white hover:shadow-md border border-slate-100 hover:border-slate-200 transition-all">
                                Edit
                             </button>
                             <button onClick={() => openModal({ title: 'Delete School', message: 'Are you sure? This will delete the school profile and all associated data. This action is irreversible.', confirmText: 'Delete School', onConfirm: () => handleDeleteSchool(school.id) })} className="px-3 py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-600 hover:text-white border border-red-50 hover:border-red-600 transition-all">
                                Delete
                             </button>
                        </div>
                    </div>
                </div>
            ))}
            {filteredSchools.length === 0 && (
                 <div className="col-span-full py-12 text-center text-slate-400 italic">No schools match your search.</div>
            )}
        </div>

        {filteredSchools.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                 <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        )}
    </div>
    );
});

const SettingsTab: React.FC<{ showToast: any }> = memo(({ showToast }) => {
    const [config, setConfig] = useState({
        announcement: { message: '', type: 'info', enabled: false },
        maintenance: { enabled: false }
    });
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'system_settings', 'config'));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setConfig({ 
                        announcement: { message: '', type: 'info', enabled: false, ...data.announcement },
                        maintenance: { enabled: false, ...data.maintenance }
                    } as any);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setInitLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await setDoc(doc(db, 'system_settings', 'config'), config, { merge: true });
            showToast("System settings saved successfully", "success");
        } catch (e) {
            showToast("Failed to save settings", "error");
        } finally {
            setLoading(false);
        }
    };

    if (initLoading) return <div className="p-8 text-center text-slate-400">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 font-display">Global Announcement</h3>
                            <p className="text-sm text-slate-500">Broadcast messages to all users</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={config.announcement.enabled} onChange={(e) => setConfig({...config, announcement: {...config.announcement, enabled: e.target.checked}})} />
                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <div className={`space-y-6 transition-all duration-300 ${config.announcement.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Message Content</label>
                            <input type="text" value={config.announcement.message} onChange={e => setConfig({...config, announcement: {...config.announcement, message: e.target.value}})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium shadow-sm" placeholder="e.g. System maintenance scheduled..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Alert Level</label>
                            <div className="flex gap-3">
                                {['info', 'warning', 'critical'].map(t => (
                                    <button 
                                        key={t} 
                                        onClick={() => setConfig({...config, announcement: {...config.announcement, type: t}})}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize border transition-all duration-200 ${config.announcement.type === t ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    {config.maintenance.enabled && (
                        <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ef4444_10px,#ef4444_20px)] opacity-50"></div>
                    )}
                    
                    <div>
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-600 border border-rose-100">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 font-display">Maintenance Mode</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Temporarily disable login for all non-admin users.</p>
                    </div>

                    <div className="mt-8">
                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:border-rose-200 transition-colors">
                            <span className={`text-sm font-bold ${config.maintenance.enabled ? 'text-rose-600' : 'text-slate-600'}`}>{config.maintenance.enabled ? 'System Locked' : 'System Active'}</span>
                            <div className="relative inline-flex items-center">
                                <input type="checkbox" className="sr-only peer" checked={config.maintenance.enabled} onChange={(e) => setConfig({...config, maintenance: { enabled: e.target.checked }})} />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end">
                <button onClick={handleSave} disabled={loading} className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center gap-3 group">
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <svg className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                    Save Configuration
                </button>
            </div>
        </div>
    );
});

const EditSchoolModal: React.FC<{ school: SchoolProfile; onClose: () => void; onSave: (s: SchoolProfile) => void }> = ({ school, onClose, onSave }) => {
    const [formData, setFormData] = useState<SchoolProfile>({ ...school });

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-down">
                 <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 font-display">Edit School Profile</h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">{school.id}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                 </div>
                 <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">School Name</label>
                          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">UDISE Code</label>
                              <input type="text" value={formData.udiseCode} onChange={e => setFormData({...formData, udiseCode: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium transition-all" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                              <div className="relative">
                                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as SchoolType})} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium transition-all appearance-none">
                                      {Object.values(SchoolType).map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                  </div>
                              </div>
                           </div>
                      </div>
                      <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Headmaster Name</label>
                           <input type="text" value={formData.headmasterName} onChange={e => setFormData({...formData, headmasterName: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium transition-all" />
                      </div>
                 </div>
                 <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                     <button onClick={onClose} className="px-6 py-3 text-slate-600 font-bold hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all">Cancel</button>
                     <button onClick={() => onSave(formData)} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5">Save Changes</button>
                 </div>
            </div>
        </div>
    );
};

export default Dashboard;
