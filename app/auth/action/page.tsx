'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  applyActionCode,
  confirmPasswordReset,
  checkActionCode,
  reload,
} from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AuthActionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AuthActionContent />
    </Suspense>
  );
}

function AuthActionContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || '';
  const oobCode = searchParams.get('oobCode') || '';
  const router = useRouter();
  const { currentUser } = useAuth();

  const [status, setStatus] = useState<'working' | 'ready' | 'done' | 'error'>('working');
  const [message, setMessage] = useState('Processing…');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setStatus('error');
      setMessage('Invalid or missing action code.');
      return;
    }

    const { auth } = getFirebaseServices();
    if (!auth) {
      setStatus('error');
      setMessage('Authentication is not ready. Refresh the page.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (mode === 'verifyEmail' || mode === 'verifyAndChangeEmail') {
          await applyActionCode(auth, oobCode);
          if (auth.currentUser) {
            await reload(auth.currentUser);
            const idToken = await auth.currentUser.getIdToken(true);
            await fetch('/api/auth/email-verified', {
              method: 'POST',
              headers: { Authorization: `Bearer ${idToken}` },
            });
          }
          if (!cancelled) {
            setStatus('done');
            setMessage('Your email is verified. A welcome message from our Founder is on its way.');
          }
          return;
        }

        if (mode === 'resetPassword') {
          const info = await checkActionCode(auth, oobCode);
          if (!cancelled) {
            setEmail(info.data.email || '');
            setStatus('ready');
            setMessage('Choose a new password for your account.');
          }
          return;
        }

        if (!cancelled) {
          setStatus('error');
          setMessage('Unsupported action. Try the link from your email again.');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(err instanceof Error ? err.message : 'This link is invalid or has expired.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, oobCode]);

  // If user verifies while logged out, welcome email waits until they log in
  useEffect(() => {
    if (status !== 'done' || mode !== 'verifyEmail' || !currentUser?.emailVerified) return;
    (async () => {
      try {
        const idToken = await currentUser.getIdToken(true);
        await fetch('/api/auth/email-verified', {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` },
        });
      } catch {
        /* ignore */
      }
    })();
  }, [status, mode, currentUser]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setMessage('Passwords do not match.');
      return;
    }
    const { auth } = getFirebaseServices();
    if (!auth || !oobCode) return;
    setSaving(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus('done');
      setMessage('Password updated. You can sign in with your new password.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-card rounded-xl border border-border p-8 text-center">
          <h1 className="font-heading text-2xl font-bold mb-3">
            {mode === 'resetPassword' ? 'Reset password' : 'Email verification'}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>

          {status === 'ready' && mode === 'resetPassword' && (
            <form onSubmit={handleReset} className="space-y-4 text-left">
              {email && (
                <p className="text-xs text-muted-foreground">Account: {email}</p>
              )}
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-4 py-2 bg-input border border-border rounded-lg"
              />
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-2 bg-input border border-border rounded-lg"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}

          {status === 'done' && (
            <Link href="/login" className="text-sm font-semibold text-accent">
              Continue to login →
            </Link>
          )}
          {status === 'error' && (
            <Link href="/forgot-password" className="text-sm font-semibold text-accent">
              Request a new link →
            </Link>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
