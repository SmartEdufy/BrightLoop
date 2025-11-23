


import React, { useState, useEffect, memo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// --- ICONS ---
const MenuIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
));

const CloseIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
));

const ChevronRightIcon = memo(() => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
));

// --- LOGO ---
const Logo = memo(() => (
  <div className="flex items-center gap-3 group cursor-pointer select-none">
    <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-500 ease-out group-hover:shadow-indigo-500/40 group-hover:scale-110 group-hover:rotate-3">
      <svg className="w-6 h-6 text-white transform transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
    </div>
    <span className="text-xl font-bold font-display tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors duration-300">BrightLoop</span>
  </div>
));

const SocialLink = memo(({ href, path, viewBox = "0 0 24 24", label, colorClass }: { href: string; path: string; viewBox?: string; label?: string, colorClass?: string }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    aria-label={label}
    className={`p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${colorClass || 'hover:text-white hover:border-slate-700'}`}
  >
    <svg className="w-5 h-5 fill-current" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
      <path d={path} />
    </svg>
  </a>
));

// --- FOOTER (Premium Professional Layout) ---
const Footer = memo(() => (
  <footer className="bg-slate-950 relative z-10 overflow-hidden">
    {/* Top Gradient Line */}
    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-900/50 to-transparent"></div>
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent blur-sm"></div>

    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-10">
      
      {/* Top Section: Brand & Call to Action */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
        
        {/* Brand Info */}
        <div className="max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20 ring-1 ring-white/10">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight font-display">BrightLoop</span>
          </div>
          <p className="text-slate-400 text-base leading-relaxed">
            The comprehensive operating system for modern educational institutions. Automate results, manage admissions, and generate your school's website in seconds.
          </p>
        </div>

        {/* Connect Section */}
        <div className="flex flex-col gap-6 w-full lg:w-auto">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Connect With Us</p>
            <div className="flex gap-4">
                {/* WhatsApp */}
                <SocialLink 
                  label="WhatsApp"
                  href="#" 
                  colorClass="hover:text-green-400 hover:border-green-900/30 hover:shadow-green-900/20"
                  path="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.005 3.676 3.747-1.009zm12.653-5.23c-.579-.288-3.413-1.712-3.94-1.907-.526-.194-.91-.289-1.294.288-.383.579-1.486 1.907-1.823 2.293-.332.386-.668.433-1.246.144-2.656-1.327-4.241-2.366-6.076-5.545-.216-.374.216-.347.62-.75.216-.215.48-.579.719-.869.24-.288.316-.481.48-.795.162-.312.082-.59-.041-.83-.125-.24-1.12-2.704-1.534-3.702-.404-.976-.812-.843-1.115-.858-.289-.015-.62-.015-.951-.015-.331 0-.87.124-1.323.619-.454.495-1.731 1.692-1.731 4.125 0 2.433 1.771 4.784 2.02 5.12.245.337 3.485 5.331 8.456 7.473 3.372 1.452 4.052 1.162 4.778 1.09.726-.072 2.336-.954 2.665-1.874.329-.921.329-1.711.231-1.874-.098-.164-.365-.262-.943-.551z" 
                />
                {/* Facebook */}
                <SocialLink 
                  label="Facebook"
                  href="#" 
                  colorClass="hover:text-blue-400 hover:border-blue-900/30 hover:shadow-blue-900/20"
                  path="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" 
                />
                {/* Instagram */}
                <SocialLink 
                  label="Instagram"
                  href="#" 
                  colorClass="hover:text-pink-400 hover:border-pink-900/30 hover:shadow-pink-900/20"
                  path="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" 
                />
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-slate-800/50 via-slate-800 to-slate-800/50 mb-8"></div>

      {/* Bottom Section */}
      <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <span className="text-slate-500 text-sm">© {new Date().getFullYear()} BrightLoop Inc.</span>
           <span className="hidden md:block w-1 h-1 bg-slate-700 rounded-full"></span>
           <span className="text-slate-600 text-sm hover:text-slate-400 cursor-pointer transition-colors">Terms</span>
           <span className="text-slate-600 text-sm hover:text-slate-400 cursor-pointer transition-colors">Privacy</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Developer Credit */}
          <div className="group flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all cursor-default shadow-sm">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold group-hover:text-indigo-400/70 transition-colors">Crafted by</span>
              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Khan Sajad</span>
          </div>
          
          {/* Status */}
          <div className="flex items-center gap-2">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </span>
             <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">System Operational</span>
          </div>
        </div>
      </div>

    </div>
  </footer>
));

// --- PUBLIC HEADER LAYOUT ---
export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const headerRef = useRef<HTMLElement>(null);

  // DIRECT DOM SCROLL OPTIMIZATION
  useEffect(() => {
    let ticking = false;

    const updateHeader = () => {
      if (headerRef.current) {
        const scrolled = window.scrollY > 20;
        if (scrolled) {
          // Glassmorphism active
          headerRef.current.classList.add('bg-white/80', 'backdrop-blur-xl', 'shadow-sm', 'border-b', 'border-slate-200/50');
          headerRef.current.classList.remove('bg-transparent');
        } else {
          // Transparent top
          headerRef.current.classList.remove('bg-white/80', 'backdrop-blur-xl', 'shadow-sm', 'border-b', 'border-slate-200/50');
          headerRef.current.classList.add('bg-transparent');
        }
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    // Initial check on mount to set correct state immediately
    updateHeader();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* HEADER */}
      <header 
        ref={headerRef}
        className="fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-out bg-transparent py-4 transform-gpu will-change-[background-color,backdrop-filter] print:hidden"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-12">
                <Link to="/" className="relative z-50 focus:outline-none active:scale-95 transition-transform">
                  <Logo />
                </Link>
            </div>
            
            {/* ACTIONS (Login / Dashboard) */}
            <div className="flex items-center gap-3 pl-4">
                {currentUser ? (
                   <Link to="/dashboard" className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 border border-slate-800">
                     Dashboard <ChevronRightIcon />
                   </Link>
                ) : (
                  <div className="flex items-center gap-2">
                     <Link to="/login" className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold overflow-hidden shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-95 ring-1 ring-white/10">
                        {/* Background Gradient Animation */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient-x"></div>
                        
                        {/* Content */}
                        <span className="relative flex items-center gap-2">
                          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Sign In
                        </span>
                      </Link>
                  </div>
                )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="pt-0 flex-grow">{children}</main>
      
      <Footer />
    </div>
  );
};

// --- DASHBOARD LAYOUT ---
const SidebarLink: React.FC<{to: string; label: string; icon: React.ReactNode; onClick?: () => void;}> = ({to, label, icon, onClick}) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      onClick={onClick} 
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group font-medium text-sm relative overflow-hidden ${isActive ? 'text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      {/* Active Background Gradient */}
      {isActive && <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 z-0"></div>}
      
      <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`}>
        {icon}
      </span>
      <span className="relative z-10">{label}</span>
      
      {/* Active Indicator Dot */}
      {isActive && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/80 shadow-sm z-10"></div>}
    </Link>
  )
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systemAnnouncement, setSystemAnnouncement] = useState<{message: string, type: string} | null>(null);

  useEffect(() => {
    const fetchSystemSettings = async () => {
        try {
            const settingsDoc = await getDoc(doc(db, 'system_settings', 'config'));
            if (settingsDoc.exists()) {
                const settings = settingsDoc.data();
                if (settings.announcement && settings.announcement.enabled && settings.announcement.message) {
                    setSystemAnnouncement({
                        message: settings.announcement.message,
                        type: settings.announcement.type || 'info',
                    });
                } else {
                    setSystemAnnouncement(null);
                }
            }
        } catch (error) {
            console.error("Could not fetch system settings:", error);
        }
    };
    
    // Only fetch for school admins, not the super admin who sets the message.
    if (userProfile?.role === UserRole.SCHOOL_ADMIN) {
        fetchSystemSettings();
    }
  }, [userProfile?.role]);


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const schoolId = userProfile?.schoolId;
  const isAdmin = userProfile?.role === UserRole.ADMIN;

  const bannerStyles = {
    info: 'bg-indigo-100/50 border-indigo-200 text-indigo-800',
    warning: 'bg-amber-100/50 border-amber-200 text-amber-800',
    critical: 'bg-red-100/50 border-red-200 text-red-800',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar Backdrop for Mobile */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} print:hidden`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl border-r border-slate-200 shadow-2xl shadow-slate-200/50 transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative will-change-transform print:hidden`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center h-20">
          <Logo />
          <button className="md:hidden text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors" onClick={() => setSidebarOpen(false)}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="p-4 flex flex-col h-[calc(100vh-80px)] overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2 pb-6">
            <div className="px-4 py-4 mb-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logged in as</p>
               <p className="text-sm font-bold text-slate-800 truncate" title={userProfile?.email}>{userProfile?.email}</p>
               <div className="flex items-center gap-2">
                   {isAdmin ? (
                       <span className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded shadow-sm shadow-indigo-500/30">SUPER ADMIN</span>
                   ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${userProfile?.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                         <span className={`inline-block w-1.5 h-1.5 rounded-full ${userProfile?.isApproved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                         {userProfile?.isApproved ? 'Active' : 'Pending'}
                      </span>
                   )}
               </div>
            </div>

            {isAdmin ? (
              <>
                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-2">System Admin</p>
                <SidebarLink to="/dashboard" label="Command Center" onClick={() => setSidebarOpen(false)} icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                } />
              </>
            ) : (
              <>
                 <SidebarLink to="/dashboard" label="Dashboard" onClick={() => setSidebarOpen(false)} icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                } />
                
                {schoolId ? (
                   <>
                     <div className="my-6 border-t border-slate-100 mx-4"></div>
                     <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">School Management</p>
                     <SidebarLink to="/dashboard/settings/website" onClick={() => setSidebarOpen(false)} label="Website Settings" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>} />
                     <SidebarLink to="/dashboard/school/settings" onClick={() => setSidebarOpen(false)} label="School Profile" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
                     
                     <div className="my-6 border-t border-slate-100 mx-4"></div>
                     <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Modules</p>
                     
                     <SidebarLink to="/dashboard/admission/list" onClick={() => setSidebarOpen(false)} label="Admissions" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                     <SidebarLink to="/dashboard/database/students" onClick={() => setSidebarOpen(false)} label="Students Database" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
                     <SidebarLink to="/dashboard/reports/roll-statement" onClick={() => setSidebarOpen(false)} label="Roll Statement" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                     <SidebarLink to="/dashboard/notifications" onClick={() => setSidebarOpen(false)} label="Notifications" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>} />
                     
                     <div className="my-6 border-t border-slate-100 mx-4"></div>
                     <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Certificates</p>
                     <SidebarLink to="/dashboard/certificates/dob" onClick={() => setSidebarOpen(false)} label="DOB Certificate" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                   </>
                ) : (
                   <div className="mx-4 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="text-amber-600 mt-0.5">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-amber-900 mb-1">Setup Required</p>
                          <p className="text-xs text-amber-800 mb-3 leading-relaxed">Complete your school profile to access all features.</p>
                          <Link to="/dashboard/school/setup" onClick={() => setSidebarOpen(false)} className="inline-flex items-center text-xs font-bold text-white bg-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-700 transition">Setup Now &rarr;</Link>
                        </div>
                      </div>
                   </div>
                )}
              </>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        {/* Sticky Glass Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 h-20 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 shadow-sm transition-all print:hidden">
           <div className="flex items-center gap-4">
             <button className="md:hidden text-slate-500 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors" onClick={() => setSidebarOpen(true)}>
               <MenuIcon />
             </button>
             <div>
               <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight font-display">
                  {isAdmin ? 'Command Center' : (schoolId ? 'School Management' : 'Welcome, Admin')}
               </h1>
               <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wide">
                 {new Date().toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}
               </p>
             </div>
           </div>
           {schoolId && !isAdmin && (
             <div className="flex items-center gap-4">
                <Link to={`/s/${userProfile?.schoolId}`} target="_blank" className="hidden md:inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-xs font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 hover:text-indigo-600 transition-all shadow-sm uppercase tracking-wide">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live Website 
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </Link>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm">
                  {userProfile?.email?.[0].toUpperCase()}
                </div>
             </div>
           )}
           {isAdmin && (
             <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end">
                   <span className="text-xs font-bold text-slate-700">System Admin</span>
                   <span className="text-[10px] text-slate-400">Superuser Access</span>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg shadow-slate-900/20">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
             </div>
           )}
        </header>

        {systemAnnouncement && location.pathname === '/dashboard' && (
            <div className={`p-4 border-b flex items-center justify-center gap-2 text-sm font-semibold ${bannerStyles[systemAnnouncement.type as keyof typeof bannerStyles]} print:hidden`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                {systemAnnouncement.message}
            </div>
        )}

        <main className="p-4 md:p-8 overflow-y-auto flex-1 scroll-smooth relative print:p-0 print:overflow-visible">
           {/* Background Texture for visual interest */}
           <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] print:hidden"></div>
           <div className="relative z-10">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
};