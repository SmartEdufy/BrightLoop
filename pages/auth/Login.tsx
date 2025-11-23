import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    await loginAsDemo();
    navigate('/dashboard');
  };

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center px-4 pt-32 pb-12 relative overflow-hidden bg-slate-50 selection:bg-indigo-500 selection:text-white">
        
        {/* Premium Background Effects with Animation */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-blob mix-blend-multiply filter"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply filter"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        </div>

        <div className="max-w-md w-full bg-white/80 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl shadow-2xl shadow-indigo-500/10 border border-white/60 relative z-10 transform transition-all animate-fade-in-down">
          
          <div className="text-center mb-10">
             <Link to="/" className="inline-flex justify-center mb-6 group">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/20">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
             </Link>
             <h2 className="text-3xl font-bold text-slate-900 font-display tracking-tight">Welcome Back</h2>
             <p className="text-slate-500 mt-3 text-base font-medium">Enter your details to access your school.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50/90 backdrop-blur-sm text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3 shadow-sm animate-pulse">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 group-hover:border-indigo-200"
                  placeholder="name@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="absolute left-3.5 top-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 group-hover:border-indigo-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute left-3.5 top-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                 <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">Forgot password?</Link>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              {/* Gradient Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient-x"></div>
              
              <span className="relative flex items-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 backdrop-blur-xl px-4 text-slate-400 font-bold tracking-wider">Or continue with</span>
            </div>
          </div>

          <div>
             <button 
               onClick={handleDemoLogin}
               type="button"
               className="w-full bg-white text-slate-700 py-3.5 rounded-xl font-bold hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all border border-slate-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 group"
             >
               <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                 <svg className="w-3.5 h-3.5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </span>
               <span>View Demo Dashboard</span>
             </button>
          </div>
          
          <div className="mt-8 text-center text-sm text-slate-600">
            Don't have an account? <Link to="/signup" className="text-indigo-600 font-bold hover:text-indigo-500 hover:underline">Create free account</Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Login;