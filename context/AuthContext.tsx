import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
  loginAsDemo: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchUserProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If we are in demo mode, ignore firebase updates to prevent overriding state
      if (isDemo) return;

      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isDemo]);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log("Firebase signout skipped or failed");
    }
    setCurrentUser(null);
    setUserProfile(null);
    setIsDemo(false);
  };

  const refreshProfile = async () => {
    if (currentUser && !isDemo) {
      await fetchUserProfile(currentUser.uid);
    }
  };

  const loginAsDemo = async () => {
    setLoading(true);
    setIsDemo(true);
    
    // Create a mock Firebase User object
    const mockUser = {
      uid: 'demo-user-123',
      email: 'admin@demo-school.com',
      displayName: 'Demo Admin',
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'mock-token',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
      phoneNumber: null,
      photoURL: null,
      providerId: 'custom',
    } as unknown as User;

    setCurrentUser(mockUser);
    
    // Create a mock User Profile with a 'demo-school' ID to show the full dashboard
    setUserProfile({
      uid: 'demo-user-123',
      email: 'admin@demo-school.com',
      role: UserRole.SCHOOL_ADMIN,
      isApproved: true,
      schoolId: 'demo-school' 
    });
    
    setTimeout(() => {
        setLoading(false);
    }, 500);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, logout, refreshProfile, loginAsDemo }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};