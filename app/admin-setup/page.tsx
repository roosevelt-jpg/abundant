'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, signOut, Auth } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function AdminSetup() {
  const [email, setEmail] = useState('admin@abundantglobalclub.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'create' | 'reset'>('reset');

  const createAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('[v0] Creating admin account:', email);
      
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      console.log('[v0] User created:', uid);
      
      // Add admin role to Firestore
      await setDoc(doc(db, 'users', uid), {
        email: email,
        uid: uid,
        role: 'admin',
        createdAt: new Date(),
        displayName: 'Admin User',
      });
      
      console.log('[v0] Admin user data saved to Firestore');
      
      setMessage('Admin account created successfully!');
      setEmail('admin@abundantglobalclub.com');
      setPassword('');
      setConfirmPassword('');
      
      // Log out immediately
      await signOut(auth);
      console.log('[v0] Logged out after admin creation');
      
    } catch (err: any) {
      console.error('[v0] Error creating admin account:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('This email already has an account. Use the Reset Password option instead.');
        setStep('reset');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err.message || 'Failed to create admin account');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('[v0] Resetting admin password for:', email);
      
      // Try to sign in first to verify the account exists
      // If this fails, we'll catch it and show appropriate error
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // If we got here, the current password is correct - user wants to change to something else
      // This flow doesn't make sense, so let's provide a different approach
      
      setError('To reset password, please use Firebase Console or provide current password.');
      
    } catch (err: any) {
      console.error('[v0] Error:', err);
      
      // If wrong password, that's expected - they're setting a new one
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        // In a real app, you'd use email verification or a custom reset flow
        // For now, we'll show instructions
        setMessage(`
          To reset the admin password, you have these options:
          
          1. Use Firebase Console:
             - Go to Firebase Console
             - Navigate to Authentication
             - Find admin@abundantglobalclub.com
             - Click the three dots menu
             - Select "Reset Password"
          
          2. Contact support for password reset
        `);
      } else {
        setError(err.message || 'Error resetting password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-8">
            <h1 className="font-heading text-3xl font-bold mb-2">Admin Account Setup</h1>
            <p className="text-muted-foreground mb-8">
              Create or reset the admin account for the Abundant Global Club dashboard.
            </p>

            {/* Step Selection */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setStep('create')}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  step === 'create'
                    ? 'bg-accent text-background'
                    : 'bg-background border border-border hover:border-accent'
                }`}
              >
                Create Admin Account
              </button>
              <button
                onClick={() => setStep('reset')}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  step === 'reset'
                    ? 'bg-accent text-background'
                    : 'bg-background border border-border hover:border-accent'
                }`}
              >
                Reset Password
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-500 whitespace-pre-wrap">
                {message}
              </div>
            )}

            {/* Create Admin Form */}
            {step === 'create' && (
              <form onSubmit={createAdminAccount} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                    placeholder="admin@abundantglobalclub.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Usually admin@abundantglobalclub.com</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                    placeholder="Enter a strong password"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-accent text-background rounded-lg font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Admin Account'}
                </button>

                <div className="p-4 bg-blue-500/10 border border-blue-500 rounded-lg text-sm text-blue-500">
                  <strong>Note:</strong> This will create a new admin account. After creation, use these credentials to login at /login
                </div>
              </form>
            )}

            {/* Reset Password Form */}
            {step === 'reset' && (
              <form onSubmit={resetAdminPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Admin Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                    placeholder="admin@abundantglobalclub.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                    placeholder="Enter new password"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-accent text-background rounded-lg font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Checking...': 'Instructions for Reset'}
                </button>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg text-sm text-yellow-500">
                  <strong>To reset your password:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Go to Firebase Console</li>
                    <li>Navigate to Authentication section</li>
                    <li>Find admin@abundantglobalclub.com</li>
                    <li>Click the three-dot menu</li>
                    <li>Select "Reset Password"</li>
                  </ol>
                </div>
              </form>
            )}

            {/* Quick Links */}
            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="/login" className="block text-accent hover:underline">
                  → Go to Login Page
                </a>
                <a href="/admin-debug" className="block text-accent hover:underline">
                  → Check Admin Debug Status
                </a>
                <a href="/admin" className="block text-accent hover:underline">
                  → Go to Admin Dashboard (after login)
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
