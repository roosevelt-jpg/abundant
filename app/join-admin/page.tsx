'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { KeyRound, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';

function JoinAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [emailHint, setEmailHint] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get('code');
    if (prefill) setCode(prefill.toUpperCase());
  }, [searchParams]);

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter your invite code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public/invites/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid invite code');
      setRoleLabel(data.roleLabel);
      setPermissions(data.permissions || []);
      setEmailHint(data.emailHint);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), email: email.trim(), password, displayName: displayName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');

      const { auth } = getFirebaseServices();
      if (auth) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      setStep(3);
      setTimeout(() => router.push('/admin/dashboard'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-card rounded-xl border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="font-heading text-2xl font-bold mb-2">Join Admin Team</h1>
            <p className="text-sm text-muted-foreground">
              {step === 1 && 'Enter the invite code from your email'}
              {step === 2 && `Create your account as ${roleLabel}`}
              {step === 3 && 'Welcome aboard!'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleValidateCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Invite Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg font-mono tracking-widest"
                    placeholder="ABCD1234"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Validating...' : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              {permissions.length > 0 && (
                <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg text-sm">
                  <p className="font-medium mb-1">Your access includes:</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    {permissions.map((p) => <li key={p}>• {p}</li>)}
                  </ul>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Email (must match invite)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg"
                    placeholder={emailHint || 'you@example.com'}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-2 border border-border rounded-lg text-sm">Back</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="font-semibold mb-2">Account created successfully!</p>
              <p className="text-sm text-muted-foreground">Redirecting to admin dashboard...</p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-accent font-semibold">Sign in</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function JoinAdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <JoinAdminContent />
    </Suspense>
  );
}
