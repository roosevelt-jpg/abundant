'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User, UserRole, MemberProfile } from '@/lib/types';
import { ALL_ADMIN_PERMISSIONS } from '@/lib/permissions';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/constants';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, profile?: MemberProfile) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function syncSessionCookie(user: FirebaseUser | null) {
  try {
    if (user) {
      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
    } else {
      await fetch('/api/auth/session', { method: 'DELETE' });
    }
  } catch (err) {
    console.error('Session sync failed:', err);
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const { auth, db } = getFirebaseServices();
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      setCurrentUser(user);
      
      if (user) {
        syncSessionCookie(user);
        try {
          // Fetch user data from Firestore with error handling
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!isMounted) return;
          
          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            
            const isAdminEmail = user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
            if (isAdminEmail && userData.role !== 'super_admin') {
              updateDoc(userRef, {
                role: 'super_admin' as UserRole,
                permissions: ALL_ADMIN_PERMISSIONS,
                updatedAt: Date.now(),
              }).catch(console.error);
              userData.role = 'super_admin';
              userData.permissions = ALL_ADMIN_PERMISSIONS;
            }
            
            setUserData(userData);
          } else {
            // Create user document if it doesn't exist
            const isAdmin = user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
            const newUser: User = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'User',
              photoURL: user.photoURL || '',
              role: isAdmin ? 'super_admin' : 'member',
              permissions: isAdmin ? ALL_ADMIN_PERMISSIONS : undefined,
              membershipTier: 'member',
              joinedAt: Date.now(),
              status: 'active',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            await setDoc(userRef, newUser);
            if (isMounted) {
              setUserData(newUser);
            }
          }
        } catch (error) {
          console.error('[v0] Error fetching user data:', error);
          // Continue even if Firestore fails - set user data with basic info
          const isAdmin = user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
          if (isMounted) {
            setUserData({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'User',
              photoURL: user.photoURL || '',
              role: isAdmin ? 'super_admin' : 'member',
              permissions: isAdmin ? ALL_ADMIN_PERMISSIONS : undefined,
              membershipTier: 'member',
              joinedAt: Date.now(),
              status: 'active',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        }
      } else {
        syncSessionCookie(null);
        setUserData(null);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    profile?: MemberProfile
  ) => {
    const { auth, db } = getFirebaseServices();
    if (!auth || !db) throw new Error('Firebase not initialized');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });

      const newUser: User = {
        uid: result.user.uid,
        email,
        displayName,
        role: 'member',
        membershipTier: 'member',
        joinedAt: Date.now(),
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        country: profile?.country,
        nationality: profile?.nationality,
        city: profile?.city,
        address: profile?.address,
        locationPlaceId: profile?.locationPlaceId,
        dateOfBirth: profile?.dateOfBirth,
        gender: profile?.gender,
        profession: profile?.profession,
        joinReason: profile?.joinReason,
      };

      await setDoc(doc(db, 'users', result.user.uid), newUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { auth } = getFirebaseServices();
    if (!auth) throw new Error('Firebase not initialized');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await syncSessionCookie(result.user);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    const { auth } = getFirebaseServices();
    if (!auth) throw new Error('Firebase not initialized');
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) throw new Error('No user logged in');
    const { db } = getFirebaseServices();
    if (!db) throw new Error('Firebase not initialized');
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        ...userData,
        ...updates,
        updatedAt: Date.now(),
      }, { merge: true });
      
      setUserData(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading, signUp, signIn, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
