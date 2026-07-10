'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { ImageUpload } from '@/components/image-upload';
import { MemberLocationFields } from '@/components/member-location-fields';
import { useAuth } from '@/context/AuthContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { MemberProfile, User } from '@/lib/types';
import { isAdminRole } from '@/lib/auth-utils';

export default function DashboardProfilePage() {
  const { currentUser, userData, loading, updateUserProfile } = useAuth();
  const { authFetch } = useApiAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [title, setTitle] = useState('');
  const [profession, setProfession] = useState('');
  const [gender, setGender] = useState<User['gender'] | ''>('');
  const [photoURL, setPhotoURL] = useState('');
  const [location, setLocation] = useState<MemberProfile>({});

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.replace('/login?redirect=/dashboard/profile');
      return;
    }
    if (isAdminRole(userData?.role)) {
      router.replace('/admin/profile');
    }
  }, [loading, currentUser, userData, router]);

  useEffect(() => {
    if (!userData) return;
    setDisplayName(userData.displayName || '');
    setPhone(userData.phone || '');
    setBio(userData.bio || '');
    setTitle(userData.title || '');
    setProfession(userData.profession || '');
    setGender(userData.gender || '');
    setPhotoURL(userData.photoURL || '');
    setLocation({
      country: userData.countryOfResidence || userData.country || '',
      countryOfResidence: userData.countryOfResidence || userData.country || '',
      nationality: userData.nationality || '',
      citizenship: userData.citizenship || '',
      city: userData.city || '',
      address: userData.address || '',
      locationPlaceId: userData.locationPlaceId,
    });
  }, [userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const residence = location.countryOfResidence || location.country || '';
      const payload = {
        displayName: displayName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        title: title.trim(),
        profession: profession.trim(),
        gender: gender || undefined,
        photoUrl: photoURL || undefined,
        country: residence,
        countryOfResidence: residence,
        nationality: location.nationality || '',
        citizenship: location.citizenship || '',
        city: location.city || '',
        address: location.address || '',
      };

      const res = await authFetch('/api/members/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      await updateUserProfile({
        displayName: payload.displayName,
        phone: payload.phone,
        bio: payload.bio,
        title: payload.title,
        profession: payload.profession,
        gender: payload.gender,
        photoURL: photoURL || undefined,
        country: residence,
        countryOfResidence: residence,
        nationality: payload.nationality,
        citizenship: payload.citizenship,
        city: payload.city,
        address: payload.address,
      });

      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !currentUser) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading profile…</div>;
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-heading text-3xl font-bold mb-2">Edit profile</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Update your details and photo. Country fields use the global country list.
      </p>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-700 text-sm">{message}</div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleSave} className="space-y-6 bg-card border border-border rounded-xl p-6">
        <ImageUpload
          value={photoURL}
          onChange={setPhotoURL}
          folder="members"
          label="Profile picture"
          maxWidth={800}
          maxHeight={800}
        />

        <label className="block text-sm">
          <span className="font-medium mb-1 block">Display name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-input border border-border rounded-lg"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium mb-1 block">Email</span>
          <input
            value={userData?.email || currentUser.email || ''}
            disabled
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-muted-foreground"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium mb-1 block">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium mb-1 block">Title / headline</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Founder & CEO"
            className="w-full px-3 py-2 bg-input border border-border rounded-lg"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium mb-1 block">Profession</span>
          <input
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium mb-1 block">Gender</span>
          <select
            value={gender || ''}
            onChange={(e) => setGender(e.target.value as User['gender'])}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg"
          >
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </label>

        <MemberLocationFields value={location} onChange={setLocation} />

        <label className="block text-sm">
          <span className="font-medium mb-1 block">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg"
            placeholder="A short introduction…"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
