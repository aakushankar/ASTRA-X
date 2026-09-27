import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  callsign: string;
  role: 'astronaut' | 'payload_specialist' | 'flight_director' | 'supervisor';
  missionDesignation: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName?: string, callsign?: string, role?: UserProfileData['role']) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Sync profile from Firestore
  const fetchProfile = async (uid: string, fallbackUser?: User) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfileData);
      } else if (fallbackUser) {
        // Create initial profile if missing
        const newProfile: UserProfileData = {
          uid,
          email: fallbackUser.email || '',
          displayName: fallbackUser.displayName || fallbackUser.email?.split('@')[0] || 'Astronaut Specialist',
          callsign: fallbackUser.displayName ? fallbackUser.displayName.toUpperCase().slice(0, 8) : 'ASTRO-1',
          role: 'astronaut',
          missionDesignation: 'BAS-EXPEDITION-26',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err: unknown) {
      console.warn('Failed to fetch/create user profile in Firestore:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid, currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await fetchProfile(cred.user.uid, cred.user);
    } catch (err: any) {
      const msg = mapAuthError(err.code || err.message);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signUp = async (
    email: string, 
    pass: string, 
    displayName?: string, 
    callsign?: string, 
    role: UserProfileData['role'] = 'astronaut'
  ) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const dName = displayName?.trim() || email.split('@')[0];
      const cSign = callsign?.trim() || dName.toUpperCase().replace(/\s+/g, '-').slice(0, 10);

      // Update auth profile
      await updateProfile(cred.user, { displayName: dName });

      // Create Firestore doc
      const profile: UserProfileData = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: dName,
        callsign: cSign,
        role,
        missionDesignation: 'BAS-EXPEDITION-26',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      setUserProfile(profile);
    } catch (err: any) {
      const msg = mapAuthError(err.code || err.message);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function mapAuthError(codeOrMsg: string): string {
  if (codeOrMsg.includes('auth/invalid-email')) return 'Invalid email address format.';
  if (codeOrMsg.includes('auth/user-not-found') || codeOrMsg.includes('auth/wrong-password') || codeOrMsg.includes('auth/invalid-credential')) {
    return 'Invalid email or password.';
  }
  if (codeOrMsg.includes('auth/email-already-in-use')) return 'An account with this email already exists.';
  if (codeOrMsg.includes('auth/weak-password')) return 'Password should be at least 6 characters.';
  if (codeOrMsg.includes('auth/too-many-requests')) return 'Access temporarily disabled due to too many failed attempts. Try again later.';
  return codeOrMsg || 'Authentication error. Please check your credentials.';
}
