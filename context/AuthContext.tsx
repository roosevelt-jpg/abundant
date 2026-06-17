'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User } from '@/lib/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      setCurrentUser(user);
      
      if (user) {
        try {
          // Fetch user data from Firestore with error handling
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!isMounted) return;
          
          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            
            // If this is the admin email and role isn't set to admin, update it
            const isAdmin = user.email === 'admin@abundantglobalclub.com';
            if (isAdmin && userData.role !== 'admin') {
              updateDoc(userRef, { role: 'admin', updatedAt: Date.now() }).catch(err => {
                console.error('[v0] Failed to update admin role:', err);
              });
              userData.role = 'admin';
            }
            
            setUserData(userData);
          } else {
            // Create user document if it doesn't exist
            const isAdmin = user.email === 'admin@abundantglobalclub.com';
            const newUser: User = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'User',
              photoURL: user.photoURL || '',
              role: isAdmin ? 'admin' : 'member',
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
          const isAdmin = user.email === 'admin@abundantglobalclub.com';
          if (isMounted) {
            setUserData({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'User',
              photoURL: user.photoURL || '',
              role: isAdmin ? 'admin' : 'member',
              membershipTier: 'member',
              joinedAt: Date.now(),
              status: 'active',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        }
      } else {
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

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      
      // Create user document
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
      };
      
      await setDoc(doc(db, 'users', result.user.uid), newUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) throw new Error('No user logged in');
    
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
