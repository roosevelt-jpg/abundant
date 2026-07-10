'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

/** Banner prompting members to verify email + resend branded verification */
export function EmailVerifyBanner() {
  const { currentUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  if (!currentUser || currentUser.emailVerified) return null;

  const resend = async () => {
    setSending(true);
    setMsg('');
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend');
      setMsg('Verification email sent — check your inbox.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm">
      <p className="font-medium mb-1">Verify your email</p>
      <p className="text-muted-foreground mb-3">
        We sent a branded verification link to <strong>{currentUser.email}</strong>. After you verify,
        you&apos;ll get a welcome message from our Founder.
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={sending}
        className="btn-gradient px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Resend verification email'}
      </button>
      {msg && <p className="mt-2 text-xs">{msg}</p>}
    </div>
  );
}
