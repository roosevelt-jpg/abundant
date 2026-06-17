'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Save, Upload } from 'lucide-react';
import { updateUserProfile } from '@/lib/db-service';

export default function AdminProfilePage() {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    email: userData?.email || '',
    bio: userData?.bio || '',
    phone: userData?.phone || '',
    title: userData?.title || 'Administrator',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    router.push('/login');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      await updateUserProfile(currentUser.uid, {
        displayName: formData.displayName,
        bio: formData.bio,
        phone: formData.phone,
        title: formData.title,
      });

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('[v0] Error updating profile:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Admin Profile</h1>
        <p className="text-muted-foreground">Manage your profile information and preferences</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Profile Picture */}
          <div className="md:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center mb-4">
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt={userData.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-accent-foreground">
                    {userData?.displayName?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-center mb-4">{userData?.displayName}</p>
              <p className="text-xs text-muted-foreground text-center mb-4">{userData?.role === 'admin' ? 'Administrator' : 'Member'}</p>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                Change Avatar
              </button>
            </div>
          </div>

          {/* Profile Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-heading font-bold text-lg mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Title/Position</label>
                  <select
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option>Administrator</option>
                    <option>Manager</option>
                    <option>Coordinator</option>
                    <option>Staff</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-heading font-bold text-lg mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-background transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
