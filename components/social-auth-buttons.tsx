'use client';

import { useState } from 'react';
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase';

interface SocialAuthButtonsProps {
  /** Invite token required for signup; omit on login */
  inviteToken?: string;
  mode: 'login' | 'signup';
  onSuccess: (result: UserCredential, meta?: { emailVerified: boolean }) => void | Promise<void>;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function SocialAuthButtons({
  inviteToken,
  mode,
  onSuccess,
  onError,
  disabled,
}: SocialAuthButtonsProps) {
  const [busy, setBusy] = useState<'google' | 'facebook' | null>(null);

  const run = async (provider: 'google' | 'facebook') => {
    setBusy(provider);
    try {
      const { auth } = getFirebaseServices();
      if (!auth) throw new Error('Authentication is not ready. Refresh and try again.');

      const authProvider =
        provider === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
      if (provider === 'google') {
        authProvider.addScope('email');
        authProvider.addScope('profile');
      } else {
        authProvider.addScope('email');
        authProvider.addScope('public_profile');
      }

      const result = await signInWithPopup(auth, authProvider);

      if (mode === 'signup') {
        if (!inviteToken) throw new Error('Invite token required');
        const idToken = await result.user.getIdToken();
        const res = await fetch('/api/auth/complete-invite-oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: inviteToken, idToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Social signup failed');
        await onSuccess(result, { emailVerified: !!data.emailVerified });
      } else {
        await onSuccess(result, { emailVerified: !!result.user.emailVerified });
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setBusy(null);
        return;
      }
      if (code === 'auth/account-exists-with-different-credential') {
        onError('An account already exists with this email using a different sign-in method. Try email/password or the other provider.');
      } else {
        onError(err instanceof Error ? err.message : 'Social sign-in failed');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled || !!busy}
        onClick={() => run('google')}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
      >
        <GoogleIcon />
        {busy === 'google' ? 'Connecting…' : 'Google'}
      </button>
      <button
        type="button"
        disabled={disabled || !!busy}
        onClick={() => run('facebook')}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
      >
        <FacebookIcon />
        {busy === 'facebook' ? 'Connecting…' : 'Facebook'}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z" />
      <path fill="#34A853" d="M6.6 14.3l-.8.6-2.5 1.9C5 19.2 8.2 21 12 21c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 1-3.6 1-2.8 0-5.1-1.9-5.9-4.4z" />
      <path fill="#4A90E2" d="M3.3 7.2C2.5 8.7 2 10.3 2 12s.5 3.3 1.3 4.8l3.3-2.5C6.2 13.4 6 12.7 6 12c0-.7.2-1.4.4-2L3.3 7.2z" />
      <path fill="#FBBC05" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3.1 14.7 2 12 2 8.2 2 5 3.8 3.3 7.2L6.6 9.6C7.4 7.1 9.7 6 12 6z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.54-4.7 1.32 0 2.7.24 2.7.24v2.98h-1.52c-1.5 0-1.97.93-1.97 1.89v2.26h3.35l-.54 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}
