'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';

export default function AdminDebug() {
  const { currentUser, userData, loading } = useAuth();
  const [firebaseStatus, setFirebaseStatus] = useState<string>('Checking...');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const checkFirebase = async () => {
      try {
        // Check auth status
        if (auth) {
          setFirebaseStatus('Firebase Auth: Connected ✓');
        } else {
          setFirebaseStatus('Firebase Auth: NOT CONNECTED ✗');
        }

        // Check if current user is admin
        if (currentUser && userData) {
          const adminCheck =
            currentUser.email === 'admin@abundantglobalclub.com' ||
            userData.role === 'admin';
          setIsAdmin(adminCheck);
        }
      } catch (error) {
        setFirebaseStatus(`Error: ${error}`);
      }
    };

    checkFirebase();
  }, [currentUser, userData]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Authentication Debug</h1>

        {/* Firebase Status */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Firebase Connection</h2>
          <div className="space-y-2">
            <p className="text-sm">Status: {firebaseStatus}</p>
            <p className="text-sm">Auth Object: {auth ? 'Connected' : 'Not Available'}</p>
            <p className="text-sm">DB Object: {db ? 'Connected' : 'Not Available'}</p>
          </div>
        </div>

        {/* Auth Status */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p className="text-sm">Loading: {loading ? 'Yes' : 'No'}</p>
            <p className="text-sm">Current User: {currentUser ? 'Logged In' : 'Not Logged In'}</p>
            {currentUser && (
              <>
                <p className="text-sm">User Email: {currentUser.email}</p>
                <p className="text-sm">User UID: {currentUser.uid}</p>
              </>
            )}
          </div>
        </div>

        {/* User Data */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">User Data (Firestore)</h2>
          {userData ? (
            <div className="space-y-2 text-sm">
              <p>Display Name: {userData.displayName}</p>
              <p>Email: {userData.email}</p>
              <p>Role: {userData.role}</p>
              <p>Status: {userData.status}</p>
              <p>Is Admin: {isAdmin ? 'Yes ✓' : 'No ✗'}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No user data found</p>
          )}
        </div>

        {/* Admin Check */}
        <div className={`rounded-lg p-6 ${isAdmin ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <h2 className="text-xl font-bold mb-4">Admin Access</h2>
          <div className="space-y-2">
            <p className="text-sm font-bold">
              {isAdmin ? '✓ USER IS ADMIN - Can access admin dashboard' : '✗ USER IS NOT ADMIN - Cannot access admin dashboard'}
            </p>
            {currentUser?.email !== 'admin@abundantglobalclub.com' && userData?.role !== 'admin' && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
                <p className="font-bold mb-2">To become an admin:</p>
                <p>1. Email must be: admin@abundantglobalclub.com</p>
                <p>2. Or role must be set to 'admin' in Firestore users collection</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Links */}
        <div className="mt-8 space-y-4">
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
          >
            Go to Login
          </a>
          <a
            href="/admin/dashboard"
            className="ml-4 inline-block px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
          >
            Try Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
