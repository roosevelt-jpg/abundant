'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { Lock, Mail } from 'lucide-react';
import { SocialAuthButtons } from '@/components/social-auth-buttons';
import { getFirebaseServices } from '@/lib/firebase';

function SignupInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(Boolean(token));
  const [valid, setValid] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  useEffect(() => {
    // Public Join flow goes straight to the apply form — invite signup only with a token.
    if (!token) {
      router.replace('/apply');
      return;
    }
    fetch(`/api/auth/signup-from-invite?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.valid) throw new Error(data.error || 'Invalid invite');
        setEmail(data.email);
        setFullName(data.fullName || '');
        setValid(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Invalid invite');
        setValid(false);
      })
      .finally(() => setValidating(false));
  }, [token, router]);

  const afterAccount = async (needsVerification: boolean) => {
    if (needsVerification) {
      setVerifySent(true);
      return;
    }
    router.push('/onboarding');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup-from-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      await signIn(email, password);
      await afterAccount(!!data.needsEmailVerification);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <p className="text-muted-foreground text-sm">Taking you to the application form…</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-card rounded-xl border border-border p-8">
          {validating ? (
            <p className="text-center text-muted-foreground">Validating invite…</p>
          ) : !valid ? (
            <div className="text-center space-y-4">
              <h1 className="font-heading text-2xl font-bold">Invite expired</h1>
              <p className="text-sm text-muted-foreground">
                {error || 'This invite link is no longer valid.'}
              </p>
              <Link href="/apply" className="inline-block text-sm font-semibold text-accent">
                Apply for membership →
              </Link>
            </div>
          ) : verifySent ? (
            <div className="text-center space-y-4">
              <h1 className="font-heading text-2xl font-bold">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                We sent a branded verification link to <strong>{email}</strong>. After you verify, you&apos;ll
                receive a welcome message from our Founder.
              </p>
              <Link href="/dashboard" className="inline-block text-sm font-semibold text-accent">
                Continue to dashboard →
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="font-heading text-3xl font-bold mb-2">Create your account</h1>
                <p className="text-muted-foreground text-sm">
                  Welcome{fullName ? `, ${fullName}` : ''}. Set a password or continue with Google / Facebook.
                </p>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      value={email}
                      readOnly
                      className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <SocialAuthButtons
                mode="signup"
                inviteToken={token}
                disabled={loading}
                onError={setError}
                onSuccess={async (_cred, meta) => {
                  setLoading(true);
                  try {
                    const { auth } = getFirebaseServices();
                    if (auth?.currentUser) {
                      const idToken = await auth.currentUser.getIdToken();
                      await fetch('/api/auth/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken }),
                      });
                    }
                    if (meta?.emailVerified) {
                      router.push('/onboarding');
                    } else {
                      setVerifySent(true);
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SignUp() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SignupInner />
    </Suspense>
  );
}
