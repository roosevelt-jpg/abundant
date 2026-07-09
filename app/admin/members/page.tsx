'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Eye } from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { User } from '@/lib/types';

export default function AdminMembers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [newMember, setNewMember] = useState({ email: '', displayName: '', phone: '' });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const q = query(collection(getDb(), 'users'), where('role', '==', 'member'));
      const snap = await getDocs(q);
      setMembers(snap.docs.map((d) => d.data() as User));
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      (m.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = async () => {
    if (!newMember.email || !newMember.displayName) {
      alert('Please fill in name and email');
      return;
    }
    const id = doc(collection(getDb(), 'users')).id;
    const member: User = {
      uid: id,
      email: newMember.email,
      displayName: newMember.displayName,
      phone: newMember.phone,
      role: 'member',
      membershipTier: 'member',
      joinedAt: Date.now(),
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await setDoc(doc(getDb(), 'users', id), member);
    setNewMember({ email: '', displayName: '', phone: '' });
    setShowModal(false);
    await loadMembers();
  };

  const handleSuspend = async (member: User) => {
    const status = member.status === 'suspended' ? 'active' : 'suspended';
    await updateDoc(doc(getDb(), 'users', member.uid), { status, updatedAt: Date.now() });
    await loadMembers();
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Delete this member record?')) return;
    await deleteDoc(doc(getDb(), 'users', uid));
    await loadMembers();
  };

  if (loading) return <div className="text-center py-12">Loading members...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Members</h1>
          <p className="text-muted-foreground">Manage member accounts from Firestore</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold">
          <Plus className="w-5 h-5" /> Add Member
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-heading font-bold">Add Member</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Name" value={newMember.displayName} onChange={(e) => setNewMember({ ...newMember, displayName: e.target.value })} className="w-full px-4 py-2 bg-input border border-border rounded-lg" />
              <input placeholder="Email" type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} className="w-full px-4 py-2 bg-input border border-border rounded-lg" />
              <input placeholder="Phone" value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} className="w-full px-4 py-2 bg-input border border-border rounded-lg" />
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-border rounded-lg">Cancel</button>
                <button onClick={handleAddMember} className="flex-1 py-2 bg-accent text-accent-foreground rounded-lg font-semibold">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-heading font-bold">Member Profile</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {selected.displayName}</p>
              <p><strong>Email:</strong> {selected.email}</p>
              <p><strong>Phone:</strong> {selected.phone || '—'}</p>
              <p><strong>Tier:</strong> {selected.membershipTier}</p>
              <p><strong>Status:</strong> {selected.status}</p>
              <p><strong>Subscription:</strong> {selected.subscriptionStatus || 'none'}</p>
              <p><strong>Joined:</strong> {new Date(selected.joinedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-background/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Tier</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Joined</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.uid} className="border-t border-border hover:bg-background/50">
                <td className="px-4 py-3 text-sm font-medium">{member.displayName || '—'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{member.email}</td>
                <td className="px-4 py-3 text-sm capitalize">{member.membershipTier}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded capitalize ${
                    member.status === 'active' ? 'bg-green-500/10 text-green-600' :
                    member.status === 'suspended' ? 'bg-destructive/10 text-destructive' :
                    'bg-yellow-500/10 text-yellow-600'
                  }`}>{member.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(member.joinedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setSelected(member)} className="p-2 hover:bg-accent/10 rounded"><Eye className="w-4 h-4 text-accent" /></button>
                    <button onClick={() => handleSuspend(member)} className="p-2 hover:bg-accent/10 rounded text-xs">{member.status === 'suspended' ? 'Activate' : 'Suspend'}</button>
                    <button onClick={() => handleDelete(member.uid)} className="p-2 hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4 text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMembers.length === 0 && <p className="text-center py-8 text-muted-foreground">No members found</p>}
      </div>
    </div>
  );
}
