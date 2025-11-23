import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../../components/Layout';
import { UserRole } from '../../types';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user) {
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email,
          role: UserRole.SCHOOL_ADMIN,
          isApproved: false // Requires admin approval
        });
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center px-4 pt-32 pb-12 relative overflow-hidden bg-slate-50">
        
        {/* Unified Premium Background Effects */}
        <div className="absolute inset-0 w-full h-full">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        </div>

        <div className="max-w-md w-full bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/60 relative z-10 transform transition-all">
          
          <div className="text-center mb-8">
             <h2 className="text-3xl font-bold text-slate-900 font-display tracking-tight">Create Account</h2>
             <p className="text-slate-500 mt-3 text-base font-medium">Join BrightLoop and digitalize your school.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3 shadow-sm">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                placeholder="principal@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700 ml-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-600">
            Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-500 hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Signup;