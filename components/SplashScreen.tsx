import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC<{ isFinished: boolean }> = ({ isFinished }) => {
  const [shouldRender, setShouldRender] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fake progress bar animation that moves fast initially then slows down
    const interval = setInterval(() => {
      setProgress(prev => {
        if (isFinished) return 100;
        // Slow down as we approach 90%
        const increment = prev < 60 ? 2 : 0.5;
        return prev >= 90 ? 90 : prev + increment;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [isFinished]);

  useEffect(() => {
    if (isFinished) {
      setProgress(100);
      // Wait for the exit animation (opacity/blur) to complete before unmounting from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 800); 
      return () => clearTimeout(timer);
    }
  }, [isFinished]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-all duration-700 ease-in-out ${
        isFinished ? 'opacity-0 scale-105 filter blur-lg pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="relative mb-10 scale-110">
           <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-blob">
             <svg className="w-12 h-12 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
           </div>
           {/* Shine Effect */}
           <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
        </div>

        {/* Brand Name */}
        <h1 className="text-5xl font-bold text-slate-900 font-display tracking-tight mb-3 animate-fade-in-down">
          BrightLoop
        </h1>
        <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase mb-12 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
          School Operating System
        </p>

        {/* Progress Bar Container */}
        <div className="w-56 h-1.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
           <div 
             className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
             style={{ width: `${progress}%` }}
           ></div>
        </div>
        
        {/* Loading Text */}
        <div className="mt-5 h-6 flex items-center gap-2.5">
            {/* Spinner for extra activity indication */}
            {!isFinished && (
               <svg className="animate-spin h-3 w-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            )}
            <p className="text-xs text-slate-400 font-medium animate-pulse transition-all duration-300 min-w-[140px] text-center">
                {isFinished ? "Launching..." : (
                    <>
                        {progress < 30 && "Initializing modules..."}
                        {progress >= 30 && progress < 70 && "Verifying security..."}
                        {progress >= 70 && "Loading dashboard..."}
                    </>
                )}
            </p>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="absolute bottom-10 flex flex-col items-center gap-1.5 animate-fade-in-down" style={{ animationDelay: '0.3s' }}>
         <div className="text-slate-300 text-[10px] uppercase tracking-widest font-bold">
            Designed & Developed by
         </div>
         <div className="text-slate-500 text-xs font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Khan Sajad
         </div>
      </div>
    </div>
  );
};