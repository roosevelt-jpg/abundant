'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Plus, Trash2, Edit, X, CheckCircle, Clock } from 'lucide-react';
import type { User } from '@/lib/types';

export default function AdminMembers() {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    email: '',
    displayName: '',
    membershipTier: 'member' as const,
    status: 'approved' as const
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/members', {
        headers: {
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('[v0] Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    return await currentUser?.getIdToken();
  };

  const filteredMembers = members.filter(m =>
    (m.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSaveMember = async () => {
    if (!newMember.email || !newMember.displayName) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/members/${editingId}` : '/api/members';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newMember),
      });

      if (response.ok) {
        await fetchMembers();
        resetForm();
        setShowModal(false);
      } else {
        alert('Failed to save member');
      }
    } catch (error) {
      console.error('[v0] Error saving member:', error);
      alert('Error saving member');
    }
  };

  const handleDeleteMember = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/members/${uid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMembers(members.filter(m => m.uid !== uid));
      }
    } catch (error) {
      console.error('[v0] Error deleting member:', error);
    }
  };

  const handleEdit = (member: User) => {
    setEditingId(member.uid);
    setNewMember({
      email: member.email,
      displayName: member.displayName || '',
      membershipTier: (member.membershipTier || 'member') as any,
      status: (member.status || 'approved') as any
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setNewMember({
      email: '',
      displayName: '',
      membershipTier: 'member',
      status: 'approved'
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Members</h1>
          <p className="text-muted-foreground">Manage and review member accounts</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {/* Add/Edit Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg">{editingId ? 'Edit' : 'Add'} Member</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-background rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="member@example.com"
                  disabled={!!editingId}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={newMember.displayName}
                  onChange={(e) => setNewMember({ ...newMember, displayName: e.target.value })}
                  placeholder="Member name"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Membership Tier</label>
                <select
                  value={newMember.membershipTier}
                  onChange={(e) => setNewMember({ ...newMember, membershipTier: e.target.value as any })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="member">Member</option>
                  <option value="elite">Elite</option>
                  <option value="inner-circle">Inner Circle</option>
                  <option value="founder">Founder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={newMember.status}
                  onChange={(e) => setNewMember({ ...newMember, status: e.target.value as any })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMember}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
                >
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-12 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-muted rounded-lg animate-pulse h-16"></div>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{searchTerm ? 'No members found' : 'No members yet'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">Tier</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Joined</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.uid} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 font-medium">{member.displayName}</td>
                  <td className="py-3 px-4 text-sm">{member.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-accent/10 text-accent">
                      {member.membershipTier ? member.membershipTier.charAt(0).toUpperCase() + member.membershipTier.slice(1) : 'Member'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-sm">
                      {member.status === 'approved' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Approved</span>
                        </>
                      ) : member.status === 'pending' ? (
                        <>
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span>Pending</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-red-600" />
                          <span>Rejected</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                        title="Edit member"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.uid)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                        title="Delete member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
