import React, { useState, memo } from 'react';
import { PublicLayout } from '../components/Layout';
import { Link } from 'react-router-dom';

// --- Reusable Components ---

const FAQItem: React.FC<{ question: string; answer: string }> = memo(({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        className="flex w-full items-start justify-between py-6 text-left group select-none active:bg-slate-50 transition-colors rounded-lg px-4 -mx-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-lg font-semibold font-display transition-colors duration-200 ${isOpen ? 'text-indigo-600' : 'text-slate-900'}`}>
          {question}
        </span>
        <span className="ml-6 flex h-7 items-center">
          <svg
            className={`h-6 w-6 transform text-indigo-500 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-out will-change-[max-height,opacity] ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="pb-6 px-4 text-base leading-7 text-slate-600">{answer}</p>
      </div>
    </div>
  );
});

const GridPattern = memo(() => (
  <svg
    className="absolute inset-0 -z-10 h-full w-full stroke-slate-200/50 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)] pointer-events-none transform-gpu"
    aria-hidden="true"
  >
    <defs>
      <pattern
        id="grid-pattern"
        width={40}
        height={40}
        x="50%"
        y={-1}
        patternUnits="userSpaceOnUse"
      >
        <path d="M.5 40V.5H40" fill="none" strokeDasharray="2 2" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" strokeWidth={0} fill="url(#grid-pattern)" />
  </svg>
));

const TrustedByMarquee = memo(() => (
  <div className="w-full overflow-hidden bg-white py-10 border-y border-slate-100 relative transform-gpu">
    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 font-display">Trusted by leading institutions</p>
    <div className="relative flex overflow-x-hidden group">
      <div className="py-2 animate-scroll whitespace-nowrap flex items-center gap-16 px-8 will-change-transform">
        {/* Logos repeated twice for infinite effect */}
        {[1, 2, 3, 4].map((set) => (
           <React.Fragment key={set}>
              <span className="text-xl font-bold text-slate-400 flex items-center gap-3 grayscale opacity-60 hover:opacity-100 transition-all cursor-default font-display select-none"><div className="w-8 h-8 bg-slate-200 rounded-full"></div> St. Mary's Academy</span>
              <span className="text-xl font-bold text-slate-400 flex items-center gap-3 grayscale opacity-60 hover:opacity-100 transition-all cursor-default font-display select-none"><div className="w-8 h-8 bg-slate-200 rounded-full"></div> Delhi Public School</span>
              <span className="text-xl font-bold text-slate-400 flex items-center gap-3 grayscale opacity-60 hover:opacity-100 transition-all cursor-default font-display select-none"><div className="w-8 h-8 bg-slate-200 rounded-full"></div> GMS Hardapanzoo</span>
              <span className="text-xl font-bold text-slate-400 flex items-center gap-3 grayscale opacity-60 hover:opacity-100 transition-all cursor-default font-display select-none"><div className="w-8 h-8 bg-slate-200 rounded-full"></div> Valley School</span>
              <span className="text-xl font-bold text-slate-400 flex items-center gap-3 grayscale opacity-60 hover:opacity-100 transition-all cursor-default font-display select-none"><div className="w-8 h-8 bg-slate-200 rounded-full"></div> Green Field Institute</span>
           </React.Fragment>
        ))}
      </div>
      <div className="absolute top-0 right-0 w-12 sm:w-32 h-full bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-12 sm:w-32 h-full bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
    </div>
  </div>
));

// --- Section Components ---

const HeroSection = memo(() => (
  <section className="relative pt-28 pb-12 lg:pt-48 lg:pb-32 overflow-hidden isolate bg-white">
    <GridPattern />
    
    {/* Subtle glow behind text */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[1000px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none transform-gpu"></div>

    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex justify-center animate-fade-in-down">
          <div className="relative rounded-full px-4 py-1.5 text-sm leading-6 text-slate-600 ring-1 ring-slate-900/10 hover:ring-indigo-500/30 bg-white/80 backdrop-blur-sm transition-all shadow-sm cursor-pointer hover:shadow-md group select-none">
            <span className="font-bold text-indigo-600">New v2.0</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-slate-700 group-hover:text-slate-900 transition-colors font-medium">AI Report Card Generator</span>
            <span className="ml-1 text-indigo-600 inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-7xl lg:text-8xl mb-8 leading-tight sm:leading-[1.1] font-display">
          The Operating System <br className="hidden lg:block"/>
          for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-gradient-x bg-[length:200%_auto]">Modern Schools</span>
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl leading-8 text-slate-600 max-w-2xl mx-auto font-normal">
          Generate a premium school website in seconds. Manage students, admissions, and results from a single, beautiful dashboard designed for educators.
        </p>
        
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link to="/signup" className="relative w-full sm:w-auto rounded-full bg-slate-900 px-8 py-4 text-lg font-bold text-white shadow-xl hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 ring-4 ring-slate-900/5 overflow-hidden group">
            <span className="absolute top-0 left-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:animate-shimmer"></span>
            Get Started for Free
          </Link>
          <Link to="/s/demo-school" target="_blank" className="w-full sm:w-auto rounded-full bg-white px-8 py-4 text-lg font-bold text-slate-700 shadow-lg shadow-slate-200/50 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group">
             View Live Demo
             <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </Link>
        </div>
      </div>

      {/* 3D Dashboard Preview - Optimized for Mobile (Flat) vs Desktop (3D) */}
      <div className="mt-16 flow-root sm:mt-24 relative">
         <div className="rounded-xl bg-slate-900/5 p-2 ring-1 ring-inset ring-slate-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 backdrop-blur-sm">
            {/* Desktop: 3D Tilt | Mobile: Flat & Fast */}
            <div className="rounded-lg bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden relative aspect-[16/9] sm:aspect-[2/1] lg:transform-gpu lg:rotate-x-2 lg:perspective-1000 transition-transform duration-500 hover:rotate-x-0">
                 {/* Abstract UI Placeholder - Pure CSS for speed */}
                 <div className="absolute inset-0 bg-slate-50 flex flex-col">
                    {/* Fake Browser Header */}
                    <div className="h-10 bg-white border-b border-slate-200 flex items-center px-4 space-x-2">
                       <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]"></div>
                       <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24]"></div>
                       <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]"></div>
                       <div className="ml-6 flex-1 max-w-lg bg-slate-100 h-6 rounded-md text-[11px] text-slate-400 flex items-center px-3 font-mono border border-slate-200/50 shadow-inner hidden sm:flex">
                          <svg className="w-3 h-3 mr-2 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                          <span className="text-slate-500 mr-0.5">https://</span>brightloop.app/dashboard
                       </div>
                    </div>
                    {/* Fake Dashboard Content */}
                    <div className="flex-1 p-4 sm:p-6 grid grid-cols-12 gap-4 sm:gap-6 bg-slate-50/50 overflow-hidden">
                       {/* Sidebar */}
                       <div className="hidden sm:block col-span-3 lg:col-span-2 bg-white rounded-xl border border-slate-200/60 h-full shadow-sm p-4 space-y-4">
                          <div className="flex items-center gap-3 mb-8 px-2">
                             <div className="w-8 h-8 rounded-lg bg-indigo-600"></div>
                             <div className="h-3 bg-slate-200 rounded w-24"></div>
                          </div>
                          {[1,2,3,4,5,6].map(i => (
                             <div key={i} className="flex items-center gap-3 px-2 py-1">
                                <div className="w-5 h-5 rounded bg-slate-100"></div>
                                <div className="h-2.5 bg-slate-100 rounded w-full"></div>
                             </div>
                          ))}
                       </div>
                       {/* Main Area */}
                       <div className="col-span-12 sm:col-span-9 lg:col-span-10 space-y-4 sm:space-y-6">
                          {/* Stats Row */}
                          <div className="grid grid-cols-3 gap-4 sm:gap-6">
                             {[1,2,3].map(i => (
                                <div key={i} className="h-24 sm:h-32 bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
                                   <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-50 mb-2"></div>
                                   <div className="space-y-2">
                                     <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                                     <div className="h-3 sm:h-4 bg-slate-200 rounded w-3/4"></div>
                                   </div>
                                </div>
                             ))}
                          </div>
                          {/* Main Chart Area */}
                          <div className="h-64 sm:h-96 bg-white rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-center relative overflow-hidden group">
                             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white opacity-60"></div>
                             <div className="absolute bottom-0 left-0 w-full h-2/3 flex items-end justify-around px-6 sm:px-10 pb-6 sm:pb-10 gap-2 sm:gap-4 opacity-20">
                                {[40, 70, 50, 90, 60, 80, 45, 75, 55, 85].map((h, i) => (
                                   <div key={i} className="w-full bg-indigo-600 rounded-t-sm transition-all duration-1000" style={{ height: `${h}%` }}></div>
                                ))}
                             </div>
                             <div className="text-slate-300 font-bold text-xl sm:text-2xl tracking-widest z-10 font-display bg-white/80 px-6 py-2 rounded-full backdrop-blur-sm border border-slate-100">DASHBOARD PREVIEW</div>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 {/* Overlay Gradient for depth */}
                 <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none"></div>
            </div>
         </div>
      </div>
    </div>
  </section>
));

const WorkflowSection = memo(() => (
  <section id="workflow" className="py-24 bg-white relative">
     <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-20">
          <h2 className="text-sm font-bold leading-7 text-indigo-600 tracking-widest uppercase font-display">Zero Friction</h2>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl font-display">From Signup to Live Website<br/>in 60 Seconds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
           {/* Connecting Lines */}
           <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-100 md:hidden -z-10"></div>
           <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent -z-10"></div>
           
           {[
             { num: '01', title: 'Create Account', desc: 'Register as an admin. Instant approval for basic features.' },
             { num: '02', title: 'Setup Profile', desc: 'Enter school details, upload logo, and choose a theme.' },
             { num: '03', title: 'Auto-Launch', desc: 'BrightLoop generates your professional website instantly.' }
           ].map((step, i) => (
             <div key={i} className="relative flex flex-row md:flex-col items-start md:items-center gap-6 md:gap-0 bg-white p-4 md:p-0 rounded-2xl md:bg-transparent">
                <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-white border border-slate-100 shadow-xl flex items-center justify-center z-10 relative overflow-hidden group transition-transform lg:hover:scale-110 duration-300">
                   <div className="absolute inset-0 bg-indigo-50 scale-0 lg:group-hover:scale-100 transition-transform duration-300 rounded-2xl"></div>
                   <span className="text-2xl font-bold text-indigo-600 relative z-10 font-display">{step.num}</span>
                </div>
                <div className="text-left md:text-center md:mt-8 pt-2 md:pt-0">
                   <h3 className="text-xl font-bold text-slate-900 mb-3 font-display">{step.title}</h3>
                   <p className="text-slate-500 text-base leading-relaxed max-w-[280px] mx-auto">{step.desc}</p>
                </div>
             </div>
           ))}
        </div>
     </div>
  </section>
));

const FeaturesSection = memo(() => (
  <section id="features" className="py-32 bg-slate-50 relative overflow-hidden">
     {/* PERFORMANCE: Simple gradient bg, no blur on mobile */}
     <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-slate-50 -z-10 transform-gpu"></div>

     <div className="mx-auto max-w-7xl px-6 lg:px-8">
       <div className="mx-auto max-w-2xl text-center mb-20">
         <h2 className="text-sm font-bold leading-7 text-indigo-600 uppercase tracking-widest font-display">Everything Included</h2>
         <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl font-display">
           A complete operating system <br/> for your school
         </p>
       </div>
       
       {/* Bento Grid Layout */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Website Gen (Large) */}
          <div className="md:col-span-2 p-10 rounded-[2.5rem] bg-white shadow-lg shadow-slate-200/50 border border-slate-200/60 relative overflow-hidden group lg:hover:shadow-xl lg:hover:shadow-indigo-500/10 transition-all duration-500">
             <div className="relative z-10">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-8 text-indigo-600 lg:group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display">Instant Website Generator</h3>
                <p className="text-slate-600 max-w-md text-lg leading-relaxed">No coding required. Our engine builds a responsive, SEO-optimized website for your school automatically using your profile data.</p>
             </div>
             {/* CSS-only Spotlight Effect - Only on Desktop to prevent sticky hover on touch */}
             <div className="hidden lg:block absolute right-0 bottom-0 w-80 h-80 bg-gradient-to-tl from-indigo-50 to-transparent -mr-20 -mb-20 rounded-full z-0 group-hover:scale-150 transition-transform duration-700 ease-in-out"></div>
          </div>

          {/* Card 2: Database (Tall) */}
          <div className="md:row-span-2 p-10 rounded-[2.5rem] bg-slate-950 shadow-2xl border border-slate-800 relative overflow-hidden group lg:hover:shadow-slate-900/50 transition-all duration-500 flex flex-col">
             <div className="relative z-10 flex-1 flex flex-col">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-8 text-white border border-slate-700 lg:group-hover:border-slate-500 transition-colors shadow-lg">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 font-display">Secure Database</h3>
                <p className="text-slate-400 text-base leading-relaxed mb-12">Enterprise-grade security for sensitive student and staff records. Cloud-backed and always available.</p>
                
                {/* Abstract Data Visual */}
                <div className="mt-auto space-y-4 opacity-40 lg:group-hover:opacity-90 transition-opacity duration-500">
                   <div className="h-3 bg-slate-800 rounded-full w-full lg:group-hover:bg-indigo-500 transition-colors delay-75"></div>
                   <div className="h-3 bg-slate-800 rounded-full w-2/3 lg:group-hover:bg-violet-500 transition-colors delay-150"></div>
                   <div className="h-3 bg-slate-800 rounded-full w-4/5 lg:group-hover:bg-purple-500 transition-colors delay-200"></div>
                   <div className="h-3 bg-slate-800 rounded-full w-1/2 lg:group-hover:bg-pink-500 transition-colors delay-300"></div>
                </div>
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent opacity-0 lg:group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>

          {/* Card 3: Analytics (Wide) */}
          <div className="md:col-span-2 p-10 rounded-[2.5rem] bg-white shadow-lg shadow-slate-200/50 border border-slate-200/60 relative overflow-hidden group lg:hover:shadow-xl lg:hover:shadow-indigo-500/10 transition-all duration-500">
             <div className="relative z-10">
               <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-8 text-indigo-600 lg:group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display">Analytics & Reports</h3>
               <p className="text-slate-600 max-w-md text-lg leading-relaxed">Generate result cards, admission slips, and transfer certificates with a single click. Visualize school performance data instantly.</p>
             </div>
             <div className="hidden lg:block absolute right-0 bottom-0 w-80 h-80 bg-gradient-to-tl from-purple-50 to-transparent -mr-20 -mb-20 rounded-full z-0 group-hover:scale-150 transition-transform duration-700 ease-in-out"></div>
          </div>
       </div>
     </div>
  </section>
));

const TestimonialsSection = memo(() => (
  <section id="reviews" className="py-24 bg-white overflow-hidden">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl font-display">Loved by 500+ Schools</h2>
      </div>
      
      {/* Hybrid Layout: Snap Scroll on Mobile, Grid on Desktop */}
      <div className="flex overflow-x-auto lg:grid lg:grid-cols-3 gap-6 pb-8 lg:pb-0 snap-x snap-mandatory scroll-pl-6 -mx-6 px-6 lg:mx-0 lg:px-0 scrollbar-hide hover:cursor-grab lg:hover:cursor-auto">
        {[
          {
            q: "BrightLoop completely transformed how we manage our admissions. The website it generated is better than what we paid a developer for last year.",
            a: "Principal Sharma",
            s: "St. Xavier's School"
          },
          {
            q: "Finally, software that doesn't look like it was built in 1990. It's fast, beautiful, and my teachers actually enjoy using it.",
            a: "Mrs. K. Gupta",
            s: "Delhi Public School"
          },
          {
            q: "The automatic result generation feature saved us weeks of manual data entry. Highly recommended for any modern school.",
            a: "Mr. A. Khan",
            s: "Crescent High"
          }
        ].map((t, i) => (
          <div key={i} className="flex-none w-[85vw] sm:w-[400px] lg:w-auto snap-center bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm relative">
             <div className="flex gap-1 mb-4">
               {[1,2,3,4,5].map(s => <svg key={s} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
             </div>
             <p className="text-slate-700 text-lg leading-relaxed mb-6">"{t.q}"</p>
             <div className="flex items-center gap-4 mt-auto">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">{t.a[0]}</div>
                <div>
                   <p className="font-bold text-slate-900">{t.a}</p>
                   <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t.s}</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  </section>
));

const FAQSection = memo(() => (
  <section id="faq" className="py-24 bg-slate-50">
    <div className="mx-auto max-w-3xl px-6 lg:px-8">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-center mb-12 font-display">Frequently Asked Questions</h2>
      <div className="space-y-2">
        <FAQItem question="Is the website generation really free?" answer="Yes! When you create a school profile, BrightLoop automatically generates a public website for you. It includes hosting and a subdomain (e.g., yourschool.brightloop.app)." />
        <FAQItem question="Can I use my own domain name?" answer="Currently, we provide free subdomains. Custom domain support is coming in the Pro plan later this year." />
        <FAQItem question="Is my student data secure?" answer="Absolutely. We use enterprise-grade encryption provided by Google Cloud Platform. Your data is private and only accessible by authorized school admins." />
        <FAQItem question="How do I generate report cards?" answer="Simply enter student marks in the 'Results' module. The system automatically calculates grades, percentages, and generates a printable PDF report card instantly." />
      </div>
    </div>
  </section>
));

const CTASection = memo(() => (
  <section className="relative isolate overflow-hidden bg-slate-950 py-24 sm:py-32">
    <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950"></div>
    <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-display">
          Ready to modernize your school?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
          Join hundreds of forward-thinking headmasters who are saving time and money with BrightLoop.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/signup"
            className="rounded-full bg-white px-8 py-3.5 text-base font-bold text-slate-900 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all hover:scale-105"
          >
            Get Started Now
          </Link>
          <Link to="/login" className="text-sm font-semibold leading-6 text-white hover:text-indigo-300 transition-colors flex items-center gap-2">
            Admin Login <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  </section>
));

// --- Main Page ---

const LandingPage: React.FC = () => {
  return (
    <PublicLayout>
      <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
        <HeroSection />
        <TrustedByMarquee />
        <WorkflowSection />
        <FeaturesSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </div>
    </PublicLayout>
  );
};

export default LandingPage;
