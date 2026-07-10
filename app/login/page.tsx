'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseServices } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { isAdminRole, isPrimaryAdmin } from '@/lib/auth-utils';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { SocialAuthButtons } from '@/components/social-auth-buttons';

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

async function resolvePostLoginPath(email: string, redirect: string | null): Promise<string> {
  if (redirect?.startsWith('/')) {
    // Prefer admin redirect when the account is admin
    if (redirect.startsWith('/admin')) return redirect;
  }

  const { auth, db } = getFirebaseServices();
  if (auth?.currentUser && db) {
    try {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const role = snap.data()?.role;
      if (isAdminRole(role) || isPrimaryAdmin(email) || isPrimaryAdmin(auth.currentUser.email)) {
        return redirect?.startsWith('/admin') ? redirect : '/admin/dashboard';
      }
    } catch {
      if (isPrimaryAdmin(email) || isPrimaryAdmin(auth.currentUser.email)) {
        return '/admin/dashboard';
      }
    }
  } else if (isPrimaryAdmin(email)) {
    return '/admin/dashboard';
  }

  return redirect && redirect.startsWith('/') && !redirect.startsWith('/admin')
    ? redirect
    : '/dashboard';
}

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, currentUser, userData, loading: authLoading } = useAuth();

  // Already signed in (Firebase) but stuck on /login — sync session cookie then leave
  useEffect(() => {
    if (authLoading || !currentUser || loading) return;
    let cancelled = false;
    (async () => {
      setRedirecting(true);
      try {
        const idToken = await currentUser.getIdToken(true);
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        if (cancelled) return;
        const redirect = searchParams.get('redirect');
        const path = await resolvePostLoginPath(
          currentUser.email || userData?.email || '',
          redirect
        );
        router.replace(path);
      } catch (err) {
        console.error(err);
        if (!cancelled) setRedirecting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, currentUser, userData, loading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      const redirect = searchParams.get('redirect');
      const path = await resolvePostLoginPath(email, redirect);
      router.replace(path);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || redirecting || (currentUser && !error)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mx-auto" />
            <p className="text-sm text-muted-foreground">Taking you to your dashboard…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-card rounded-xl border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your Abundant account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="you@example.com"
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
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="mt-2 text-right">
                <Link href="/forgot-password" className="text-xs text-accent hover:text-accent/80 font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <SocialAuthButtons
            mode="login"
            disabled={loading}
            onError={setError}
            onSuccess={async () => {
              setLoading(true);
              try {
                const { auth } = getFirebaseServices();
                if (auth?.currentUser) {
                  const idToken = await auth.currentUser.getIdToken(true);
                  await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                  });
                }
                const redirect = searchParams.get('redirect');
                const path = await resolvePostLoginPath(auth?.currentUser?.email || '', redirect);
                router.replace(path);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Sign-in failed');
              } finally {
                setLoading(false);
              }
            }}
          />

          <div className="mt-6 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/apply" className="text-accent hover:text-accent/80 font-semibold">
              Apply for membership
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
