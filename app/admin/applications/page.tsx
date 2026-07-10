'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { MembershipApplication } from '@/lib/types';
import { X } from 'lucide-react';
import { getCountryName } from '@/lib/countries';

export default function AdminApplicationsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const { authFetch } = useApiAuth();
  const [apps, setApps] = useState<MembershipApplication[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<MembershipApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (userData && !hasPermission(userData, 'applications') && userData.role !== 'super_admin') {
      router.push('/admin/dashboard');
      return;
    }
    load();
  }, [userData, router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/applications');
      const data = await res.json();
      setApps(Array.isArray(data) ? data : []);
    } catch {
      setMsg('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const pending = apps.filter((a) => a.status === 'pending' || a.status === 'under_review').length;
    const approvedMonth = apps.filter((a) => a.status === 'approved' && (a.reviewedAt || 0) >= monthStart).length;
    const rejectedMonth = apps.filter((a) => a.status === 'rejected' && (a.reviewedAt || 0) >= monthStart).length;
    const decided = apps.filter((a) => a.reviewedAt && a.createdAt);
    const avgDays =
      decided.length === 0
        ? 0
        : decided.reduce((sum, a) => sum + ((a.reviewedAt! - a.createdAt) / 86400000), 0) / decided.length;
    return { pending, approvedMonth, rejectedMonth, avgDays: Math.round(avgDays * 10) / 10 };
  }, [apps]);

  const filtered = apps.filter((a) => (filter === 'all' ? true : a.status === filter));

  const act = async (action: 'approve' | 'reject' | 'under_review') => {
    if (!selected) return;
    if (action === 'approve' && !confirm('Approve and send invite email?')) return;
    if (action === 'reject' && !confirm('Reject this application?')) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await authFetch('/api/admin/applications', {
        method: 'POST',
        body: JSON.stringify({ id: selected.id, action, reviewNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMsg(action === 'approve' ? 'Approved — invite sent' : action === 'reject' ? 'Rejected' : 'Marked under review');
      setSelected(null);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  if (userData && !hasPermission(userData, 'applications') && userData.role !== 'super_admin') {
    return <div className="text-center py-12 text-muted-foreground">No permission</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-2">Membership applications</h1>
      <p className="text-muted-foreground text-sm mb-6">Review applicants — approval sends an invite; no account until they sign up.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          ['Pending', stats.pending],
          ['Approved this month', stats.approvedMonth],
          ['Rejected this month', stats.rejectedMonth],
          ['Avg days to decision', stats.avgDays],
        ].map(([label, value]) => (
          <div key={String(label)} className="p-4 bg-card border border-border rounded-xl">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-heading text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'pending', 'under_review', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === f ? 'bg-accent text-accent-foreground' : 'border border-border'}`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm text-accent mb-3">{msg}</p>}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Heard</th>
                <th className="p-3">Referred</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-border hover:bg-accent/5 cursor-pointer"
                  onClick={() => {
                    setSelected(a);
                    setNotes(a.reviewNotes || '');
                  }}
                >
                  <td className="p-3 font-medium">{a.fullName}</td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3 capitalize">{a.tierInterest.replace('_', ' ')}</td>
                  <td className="p-3">{a.howHeard}</td>
                  <td className="p-3">{a.referredByMember ? 'Yes' : 'No'}</td>
                  <td className="p-3 capitalize">{a.status.replace('_', ' ')}</td>
                  <td className="p-3">{new Date(a.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No applications
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-full max-w-lg h-full bg-card border-l border-border p-6 overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="font-heading text-xl font-bold">{selected.fullName}</h2>
              <button type="button" onClick={() => setSelected(null)}><X className="w-5 h-5" /></button>
            </div>
            <dl className="space-y-2 text-sm mb-6">
              {[
                ['Email', selected.email],
                ['Phone', selected.phone],
                ['City', selected.city],
                ['Country of Residence', getCountryName(selected.country)],
                ['Nationality', selected.nationality ? getCountryName(selected.nationality) : '—'],
                ['Citizenship', selected.citizenship ? getCountryName(selected.citizenship) : '—'],
                ['Gender', selected.gender || '—'],
                ['Role', selected.role],
                ['Company', selected.company],
                ['Industry', selected.industry],
                ['LinkedIn', selected.linkedinUrl || '—'],
                ['Experience', selected.yearsExperience ?? '—'],
                ['Tier interest', selected.tierInterest],
                ['Goals', selected.goals?.join(', ')],
                ['How heard', selected.howHeard],
                ['Referrer', selected.referredByMember ? selected.referrerName : '—'],
                ['Marketing consent', selected.marketingConsent ? 'Yes' : 'No'],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium break-words">{String(v)}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs text-muted-foreground">Why join</dt>
                <dd className="whitespace-pre-wrap">{selected.whyJoin}</dd>
              </div>
            </dl>
            <label className="block text-sm mb-4">
              <span className="font-medium mb-1 block">Internal review notes</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm" />
            </label>
            {(selected.status === 'pending' || selected.status === 'under_review') && (
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => act('under_review')} className="px-3 py-2 border border-border rounded-lg text-sm">
                  Under review
                </button>
                <button type="button" disabled={busy} onClick={() => act('approve')} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">
                  Approve
                </button>
                <button type="button" disabled={busy} onClick={() => act('reject')} className="px-3 py-2 bg-destructive text-white rounded-lg text-sm font-semibold">
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
