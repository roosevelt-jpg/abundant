'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { ResourceSubmission } from '@/lib/types';

export default function AdminResourceSubmissionsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const { authFetch } = useApiAuth();
  const [items, setItems] = useState<ResourceSubmission[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (userData && !hasPermission(userData, 'resources') && userData.role !== 'super_admin') {
      router.push('/admin/dashboard');
      return;
    }
    load();
  }, [userData, router]);

  const load = async () => {
    const res = await authFetch('/api/admin/resource-submissions');
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  };

  const act = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`${action} this submission?`)) return;
    const res = await authFetch('/api/admin/resource-submissions', {
      method: 'POST',
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Failed');
      return;
    }
    setMsg(action === 'approve' ? 'Approved and published to Resources' : 'Rejected');
    await load();
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-2">Resource submissions</h1>
      <p className="text-sm text-muted-foreground mb-6">Review member pitches before they enter the library.</p>
      {msg && <p className="text-sm text-accent mb-4">{msg}</p>}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-card border border-border rounded-xl">
            <div className="flex justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.name} · {item.email} · {item.category} · {item.status}
                </p>
              </div>
              {item.status === 'pending' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => act(item.id, 'approve')} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg">
                    Approve
                  </button>
                  <button type="button" onClick={() => act(item.id, 'reject')} className="px-3 py-1.5 text-xs bg-destructive text-white rounded-lg">
                    Reject
                  </button>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            {item.fileUrl && (
              <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent mt-2 inline-block">
                Attached file
              </a>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-muted-foreground text-sm">No submissions yet.</p>}
      </div>
    </div>
  );
}
