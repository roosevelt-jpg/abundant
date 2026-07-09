'use client';

import { useState, useEffect } from 'react';
import { getContactSubmissions, updateContactSubmission } from '@/lib/contact-service';
import { ContactSubmission } from '@/lib/types';
import { Mail, Archive, MessageSquare } from 'lucide-react';

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'responded' | 'archived'>('all');
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getContactSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter((s) => filter === 'all' || s.status === filter);

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    const replies = [
      ...(selected.replies || []),
      { message: reply, sentAt: Date.now(), sentBy: 'admin' },
    ];
    await updateContactSubmission(selected.id, { status: 'responded', replies });
    setReply('');
    setSelected(null);
    await loadSubmissions();
  };

  const handleArchive = async (id: string) => {
    await updateContactSubmission(id, { status: 'archived' });
    await loadSubmissions();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Contact Submissions</h1>
        <p className="text-muted-foreground">View and respond to contact form messages</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'new', 'responded', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
              filter === f ? 'bg-accent text-accent-foreground' : 'bg-card border border-border'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {filtered.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelected(sub)}
                className={`w-full text-left p-4 bg-card rounded-xl border transition-colors ${
                  selected?.id === sub.id ? 'border-accent' : 'border-border hover:border-accent/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium">{sub.name}</span>
                  <StatusBadge status={sub.status} />
                </div>
                <p className="text-sm text-muted-foreground">{sub.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(sub.submittedAt).toLocaleString()}
                </p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">No submissions</p>
            )}
          </div>

          {selected && (
            <div className="p-6 bg-card rounded-xl border border-border sticky top-4">
              <h3 className="font-heading font-bold text-lg mb-4">{selected.subject}</h3>
              <div className="space-y-2 text-sm mb-4">
                <p><strong>From:</strong> {selected.name} ({selected.email})</p>
                {selected.phone && <p><strong>Phone:</strong> {selected.phone}</p>}
                <p className="text-muted-foreground whitespace-pre-wrap">{selected.message}</p>
              </div>

              {selected.replies?.map((r, i) => (
                <div key={i} className="p-3 bg-background rounded-lg mb-2 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">{new Date(r.sentAt).toLocaleString()}</p>
                  {r.message}
                </div>
              ))}

              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReply}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold"
                >
                  <Mail className="w-4 h-4" /> Send Reply
                </button>
                <button
                  onClick={() => handleArchive(selected.id)}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm"
                >
                  <Archive className="w-4 h-4" /> Archive
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-600',
    responded: 'bg-green-500/10 text-green-600',
    archived: 'bg-gray-500/10 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded capitalize ${colors[status]}`}>
      {status}
    </span>
  );
}
