'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canManageInvites } from '@/lib/auth-utils';
import {
  createAdminInvite,
  getAllInvites,
  revokeInvite,
  deleteInvite,
} from '@/lib/invites-service';
import { AdminInvite } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function AdminInvitesPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [expiryDays, setExpiryDays] = useState(7);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (userData && !canManageInvites(userData.role)) {
      router.push('/admin/dashboard');
      return;
    }
    loadInvites();
  }, [userData, router]);

  const loadInvites = async () => {
    try {
      setLoading(true);
      const data = await getAllInvites();
      setInvites(data);
    } catch (err) {
      console.error('Error loading invites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!userData) return;
    try {
      await createAdminInvite(userData.uid, role, expiryDays);
      await loadInvites();
    } catch (err) {
      console.error('Error creating invite:', err);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!canManageInvites(userData?.role)) {
    return <div className="text-center py-12 text-muted-foreground">Super admin access required</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Invite Admins</h1>
        <p className="text-muted-foreground">Generate single-use invite codes for new admin accounts</p>
      </div>

      <div className="p-6 bg-card rounded-xl border border-border mb-8 max-w-xl space-y-4">
        <h2 className="font-heading font-bold">Generate Invite Code</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
              className="w-full px-4 py-2 bg-input border border-border rounded-lg"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Expires in (days)</label>
            <input
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
              min={1}
              max={90}
              className="w-full px-4 py-2 bg-input border border-border rounded-lg"
            />
          </div>
        </div>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold"
        >
          <Plus className="w-4 h-4" /> Generate Code
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading invites...</p>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-background/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Expires</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-sm">
                    <button
                      onClick={() => handleCopy(invite.code)}
                      className="flex items-center gap-2 hover:text-accent"
                    >
                      {invite.code}
                      {copied === invite.code ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{invite.role.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invite.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {invite.status === 'pending' && (
                      <button
                        onClick={() => revokeInvite(invite.id).then(loadInvites)}
                        className="text-sm text-destructive hover:underline mr-3"
                      >
                        Revoke
                      </button>
                    )}
                    <button
                      onClick={() => deleteInvite(invite.id).then(loadInvites)}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invites.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No invites yet</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    used: 'bg-green-500/10 text-green-600',
    expired: 'bg-gray-500/10 text-gray-500',
    revoked: 'bg-destructive/10 text-destructive',
  };
  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded capitalize ${colors[status] || ''}`}>
      {status}
    </span>
  );
}
