'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X, Eye, User as UserIcon } from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { User } from '@/lib/types';
import { getCountryName } from '@/lib/countries';
import { CountrySelect } from '@/components/country-select';
import { MemberLocationFields } from '@/components/member-location-fields';

function residenceOf(m: User) {
  return m.countryOfResidence || m.country || '';
}

function formatJoined(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminMembers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [newMember, setNewMember] = useState({
    email: '',
    displayName: '',
    phone: '',
    country: '',
    nationality: '',
    citizenship: '',
    city: '',
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const q = query(collection(getDb(), 'users'), where('role', '==', 'member'));
      const snap = await getDocs(q);
      setMembers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as User)));
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      (m.displayName || '').toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.city || '').toLowerCase().includes(q) ||
      getCountryName(residenceOf(m)).toLowerCase().includes(q) ||
      getCountryName(m.nationality || '').toLowerCase().includes(q) ||
      getCountryName(m.citizenship || '').toLowerCase().includes(q)
    );
  });

  const handleAddMember = async () => {
    if (!newMember.email || !newMember.displayName) {
      alert('Please fill in name and email');
      return;
    }
    try {
      const id = doc(collection(getDb(), 'users')).id;
      const now = Date.now();
      const member: User = {
        uid: id,
        email: newMember.email,
        displayName: newMember.displayName,
        phone: newMember.phone,
        country: newMember.country,
        countryOfResidence: newMember.country,
        nationality: newMember.nationality || newMember.country,
        citizenship: newMember.citizenship || newMember.nationality || newMember.country,
        city: newMember.city,
        role: 'member',
        membershipTier: 'global',
        joinedAt: now,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(getDb(), 'users', id), member);
      setNewMember({
        email: '',
        displayName: '',
        phone: '',
        country: '',
        nationality: '',
        citizenship: '',
        city: '',
      });
      setShowAdd(false);
      await loadMembers();
    } catch (err) {
      console.error('Error adding member:', err);
      const message = err instanceof Error ? err.message : 'Failed to add member';
      alert(message.includes('permission') ? 'Permission denied. Deploy updated Firestore rules, then try again.' : message);
    }
  };

  const openCard = (member: User) => {
    setSelected(member);
    setEditing(false);
    setEditForm({
      displayName: member.displayName,
      phone: member.phone,
      bio: member.bio,
      title: member.title,
      country: residenceOf(member),
      countryOfResidence: residenceOf(member),
      nationality: member.nationality,
      citizenship: member.citizenship,
      city: member.city,
      address: member.address,
      gender: member.gender,
      profession: member.profession,
    });
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    try {
      const residence = editForm.countryOfResidence || editForm.country || '';
      await updateDoc(doc(getDb(), 'users', selected.uid), {
        displayName: editForm.displayName,
        phone: editForm.phone || '',
        bio: editForm.bio || '',
        title: editForm.title || '',
        country: residence,
        countryOfResidence: residence,
        nationality: editForm.nationality || '',
        citizenship: editForm.citizenship || '',
        city: editForm.city || '',
        address: editForm.address || '',
        gender: editForm.gender || null,
        profession: editForm.profession || '',
        updatedAt: Date.now(),
      });
      setEditing(false);
      setSelected(null);
      await loadMembers();
    } catch (err) {
      console.error(err);
      alert('Failed to update member');
    }
  };

  const handleSuspend = async (member: User) => {
    const status = member.status === 'suspended' ? 'active' : 'suspended';
    await updateDoc(doc(getDb(), 'users', member.uid), { status, updatedAt: Date.now() });
    await loadMembers();
    if (selected?.uid === member.uid) setSelected({ ...member, status });
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Delete this member record?')) return;
    await deleteDoc(doc(getDb(), 'users', uid));
    if (selected?.uid === uid) setSelected(null);
    await loadMembers();
  };

  if (loading) return <div className="text-center py-12">Loading members...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Members</h1>
          <p className="text-muted-foreground">Click a row to open the member card</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold"
        >
          <Plus className="w-5 h-5" /> Add Member
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="font-heading font-bold">Add Member</h2>
              <button type="button" onClick={() => setShowAdd(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                placeholder="Name"
                value={newMember.displayName}
                onChange={(e) => setNewMember({ ...newMember, displayName: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg"
              />
              <input
                placeholder="Email"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg"
              />
              <input
                placeholder="Phone"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg"
              />
              <input
                placeholder="City"
                value={newMember.city}
                onChange={(e) => setNewMember({ ...newMember, city: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg"
              />
              <CountrySelect
                label="Country of Residence"
                value={newMember.country}
                onChange={(code) =>
                  setNewMember({
                    ...newMember,
                    country: code,
                    nationality: newMember.nationality || code,
                    citizenship: newMember.citizenship || newMember.nationality || code,
                  })
                }
              />
              <CountrySelect
                label="Nationality"
                value={newMember.nationality}
                onChange={(code) => setNewMember({ ...newMember, nationality: code })}
              />
              <CountrySelect
                label="Citizenship"
                value={newMember.citizenship}
                onChange={(code) => setNewMember({ ...newMember, citizenship: code })}
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-border rounded-lg">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="flex-1 py-2 bg-accent text-accent-foreground rounded-lg font-semibold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">Member card</h2>
              <button type="button" onClick={() => setSelected(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                  {selected.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-2xl font-bold truncate">{selected.displayName || '—'}</h3>
                  <p className="text-muted-foreground truncate">{selected.email}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded capitalize bg-accent/10 text-accent">
                      {selected.membershipTier}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded capitalize ${
                        selected.status === 'active'
                          ? 'bg-green-500/10 text-green-600'
                          : selected.status === 'suspended'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-yellow-500/10 text-yellow-600'
                      }`}
                    >
                      {selected.status}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                      Joined {formatJoined(selected.joinedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {!editing ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <Detail label="Phone" value={selected.phone} />
                  <Detail label="Gender" value={selected.gender?.replace(/_/g, ' ')} />
                  <Detail label="City" value={selected.city} />
                  <Detail label="Address" value={selected.address} />
                  <Detail label="Country of Residence" value={getCountryName(residenceOf(selected)) || undefined} />
                  <Detail label="Nationality" value={selected.nationality ? getCountryName(selected.nationality) : undefined} />
                  <Detail label="Citizenship" value={selected.citizenship ? getCountryName(selected.citizenship) : undefined} />
                  <Detail label="Profession" value={selected.profession || selected.title} />
                  <Detail label="Subscription" value={selected.subscriptionStatus || 'none'} />
                  <Detail label="Date joined" value={formatJoined(selected.joinedAt)} />
                  {selected.bio && (
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Bio</dt>
                      <dd>{selected.bio}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <div className="space-y-4">
                  <input
                    value={editForm.displayName || ''}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    placeholder="Display name"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                  />
                  <input
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Phone"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                  />
                  <select
                    value={editForm.gender || ''}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as User['gender'] })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                  >
                    <option value="">Gender…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  <MemberLocationFields
                    value={{
                      country: editForm.country,
                      countryOfResidence: editForm.countryOfResidence || editForm.country,
                      nationality: editForm.nationality,
                      citizenship: editForm.citizenship,
                      city: editForm.city,
                      address: editForm.address,
                    }}
                    onChange={(profile) => setEditForm({ ...editForm, ...profile })}
                  />
                  <textarea
                    value={editForm.bio || ''}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Bio"
                    rows={3}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-border">
                {!editing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold"
                    >
                      Edit profile
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSuspend(selected)}
                      className="px-4 py-2 border border-border rounded-lg text-sm"
                    >
                      {selected.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(selected.uid)}
                      className="px-4 py-2 border border-destructive/30 text-destructive rounded-lg text-sm"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 border border-border rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
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
          placeholder="Search by name, email, city, country…"
          className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="bg-background/50 border-b border-border">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Member</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Residence</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nationality</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Citizenship</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">City</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tier</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date joined</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr
                key={member.uid}
                onClick={() => openCard(member)}
                className="border-t border-border hover:bg-accent/5 cursor-pointer transition-colors"
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      {member.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">
                          {(member.displayName || member.email || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{member.displayName || '—'}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-sm text-muted-foreground">{member.email}</td>
                <td className="px-3 py-3 text-sm text-muted-foreground">{member.phone || '—'}</td>
                <td className="px-3 py-3 text-sm">{residenceOf(member) ? getCountryName(residenceOf(member)) : '—'}</td>
                <td className="px-3 py-3 text-sm">{member.nationality ? getCountryName(member.nationality) : '—'}</td>
                <td className="px-3 py-3 text-sm">{member.citizenship ? getCountryName(member.citizenship) : '—'}</td>
                <td className="px-3 py-3 text-sm">{member.city || '—'}</td>
                <td className="px-3 py-3 text-sm capitalize">{member.membershipTier}</td>
                <td className="px-3 py-3">
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded capitalize ${
                      member.status === 'active'
                        ? 'bg-green-500/10 text-green-600'
                        : member.status === 'suspended'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-yellow-500/10 text-yellow-600'
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatJoined(member.joinedAt)}</td>
                <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => openCard(member)} className="p-2 hover:bg-accent/10 rounded" title="View card">
                      <Eye className="w-4 h-4 text-accent" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSuspend(member)}
                      className="p-2 hover:bg-accent/10 rounded text-xs"
                    >
                      {member.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                    <button type="button" onClick={() => handleDelete(member.uid)} className="p-2 hover:bg-destructive/10 rounded">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
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

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="capitalize">{value || '—'}</dd>
    </div>
  );
}
