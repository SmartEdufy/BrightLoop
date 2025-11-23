


import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/Landing.tsx';
import Login from './pages/auth/Login.tsx';
import Signup from './pages/auth/Signup.tsx';
import Dashboard from './pages/dashboard/Dashboard.tsx';
import SchoolSetup from './pages/dashboard/SchoolSetup.tsx';
import SchoolProfilePage from './pages/dashboard/SchoolProfile.tsx';
import WebsiteSettings from './pages/dashboard/WebsiteSettings.tsx';
import SchoolWebsite from './pages/generated/SchoolWebsite.tsx';
import Students from './pages/dashboard/Students.tsx';
import Admission from './pages/dashboard/Admission.tsx';
import AdmissionList from './pages/dashboard/AdmissionList.tsx';
import RollStatement from './pages/dashboard/RollStatement.tsx';
import DOBCertificate from './pages/dashboard/DOBCertificate.tsx';
import { SplashScreen } from './components/SplashScreen.tsx';

// ScrollToTop Component: Resets window scroll to 0 on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    // Force instant scroll to top on route change to prevent content flashing under header
    document.documentElement.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" as ScrollBehavior, 
    });
  }, [pathname]);

  return null;
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // While Auth is checking, we return null because the Splash Screen in App component handles the visual
    return null; 
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        {/* Public App Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* The "Subdomain" Simulation Route */}
        <Route path="/s/:slug" element={<SchoolWebsite />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Route for Initial Setup */}
        <Route path="/dashboard/school/setup" element={
          <ProtectedRoute>
            <SchoolSetup />
          </ProtectedRoute>
        } />

        {/* Route for Profile Settings (Management) */}
        <Route path="/dashboard/school/settings" element={
          <ProtectedRoute>
            <SchoolProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/settings/website" element={
          <ProtectedRoute>
            <WebsiteSettings />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/database/students" element={
          <ProtectedRoute>
            <Students />
          </ProtectedRoute>
        } />
        
        {/* New Admission Routes */}
        <Route path="/dashboard/admission" element={
          <ProtectedRoute>
            <Admission />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/admission/list" element={
          <ProtectedRoute>
            <AdmissionList />
          </ProtectedRoute>
        } />

        {/* Reports Routes */}
        <Route path="/dashboard/reports/roll-statement" element={
          <ProtectedRoute>
            <RollStatement />
          </ProtectedRoute>
        } />

        {/* Certificate Routes */}
        <Route path="/dashboard/certificates/dob" element={
          <ProtectedRoute>
            <DOBCertificate />
          </ProtectedRoute>
        } />
        
        {/* Fallback for other dashboard routes to main dashboard for now */}
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </HashRouter>
  );
};

const AppLayout: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Ensure Splash shows for at least 1.5 seconds for branding impact
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only remove splash when BOTH: Auth is done checking AND min time has passed
    if (!authLoading && minTimeElapsed) {
      setShowSplash(false);
    }
  }, [authLoading, minTimeElapsed]);

  return (
    <>
      {/* Pass the !showSplash boolean to trigger the exit animation */}
      <SplashScreen isFinished={!showSplash} />
      
      {/* 
        We render the app immediately so it hydrates in the background,
        but we hide it visually until the splash exit animation begins.
      */}
      <div className={`transition-opacity duration-1000 delay-300 ${!showSplash ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
         <AppContent />
      </div>
    </>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
       <AppLayout />
    </AuthProvider>
  );
};

export default App;