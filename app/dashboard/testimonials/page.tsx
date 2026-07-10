'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApiAuth } from '@/hooks/useApiAuth';

export default function DashboardTestimonialsPage() {
  const { currentUser, userData } = useAuth();
  const { authFetch } = useApiAuth();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || content.trim().length < 20) {
      setError('Please write at least a few sentences.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await authFetch('/api/members/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          authorName: userData?.displayName || currentUser.email,
          authorTitle: userData?.title || userData?.profession || '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setMessage('Thank you — your testimonial was submitted for review.');
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-heading text-3xl font-bold mb-2">Share a testimonial</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Tell others about your experience with Abundant Global Club. Submissions are reviewed before publishing.
      </p>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-700 text-sm">{message}</div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-xl p-6">
        <label className="block text-sm">
          <span className="font-medium mb-1 block">Your testimonial</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            required
            className="w-full px-3 py-2 bg-input border border-border rounded-lg"
            placeholder="Share what membership has meant for you…"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-60"
        >
          {saving ? 'Submitting…' : 'Submit for review'}
        </button>
      </form>
    </div>
  );
}
