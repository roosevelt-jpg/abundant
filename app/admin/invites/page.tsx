'use client';

import { useState, useEffect } from 'react';
import { Trash2, Copy, Check, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canManageInvites } from '@/lib/auth-utils';
import { getAllInvites, revokeInvite, deleteInvite } from '@/lib/invites-service';
import { AdminInvite, AdminPermission } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { ADMIN_PERMISSION_DEFS } from '@/lib/permissions';

const ASSIGNABLE_PERMISSIONS = ADMIN_PERMISSION_DEFS.filter((p) => p.id !== 'invites');

export default function AdminInvitesPage() {
  const { userData } = useAuth();
  const { authFetch } = useApiAuth();
  const router = useRouter();
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [permissions, setPermissions] = useState<AdminPermission[]>(['dashboard', 'members']);
  const [expiryDays, setExpiryDays] = useState(7);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const togglePermission = (perm: AdminPermission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSendInvite = async () => {
    if (!email.trim()) {
      setError('Please enter the invitee email address');
      return;
    }
    if (role === 'admin' && permissions.length === 0) {
      setError('Select at least one permission');
      return;
    }
    try {
      setSending(true);
      setError(null);
      const res = await authFetch('/api/admin/invites', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          role,
          permissions: role === 'super_admin' ? undefined : permissions,
          expiresInDays: expiryDays,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invite');
      }
      setEmail('');
      await loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSending(false);
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
        <p className="text-muted-foreground">
          Invite admins with specific section permissions. They will use their invite code and email at{' '}
          <a href="/join-admin" className="text-accent hover:underline">/join-admin</a> to create their account.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="p-6 bg-card rounded-xl border border-border mb-8 max-w-2xl space-y-4">
        <h2 className="font-heading font-bold">Send Admin Invite</h2>
        <p className="text-sm text-muted-foreground">Configure Gmail SMTP in Settings → Integrations first.</p>
        <div>
          <label className="block text-sm font-medium mb-2">Invitee Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="w-full px-4 py-2 bg-input border border-border rounded-lg"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
              className="w-full px-4 py-2 bg-input border border-border rounded-lg"
            >
              <option value="admin">Admin (custom permissions)</option>
              <option value="super_admin">Super Admin (full access)</option>
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

        {role === 'admin' && (
          <div>
            <label className="block text-sm font-medium mb-2">Section Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ASSIGNABLE_PERMISSIONS.map((perm) => (
                <label
                  key={perm.id}
                  className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer text-sm ${
                    permissions.includes(perm.id) ? 'border-accent bg-accent/5' : 'border-border'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium block">{perm.label}</span>
                    <span className="text-xs text-muted-foreground">{perm.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSendInvite}
          disabled={sending}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50"
        >
          <Mail className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Invite Email'}
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading invites...</p>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-background/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Permissions</th>
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
                  <td className="px-4 py-3 text-sm text-muted-foreground">{invite.email}</td>
                  <td className="px-4 py-3 text-sm capitalize">{invite.role.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {invite.role === 'super_admin'
                      ? 'All sections'
                      : invite.permissions?.length
                        ? `${invite.permissions.length} section(s)`
                        : '—'}
                  </td>
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
