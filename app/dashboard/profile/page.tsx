'use client';

import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Upload, Check, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { userData, currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    phone: userData?.phone || '',
    title: userData?.title || '',
    bio: userData?.bio || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateUserProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('[v0] Profile update error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-muted-foreground">Update your personal information</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900' 
            : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${
            message.type === 'success'
              ? 'text-green-900 dark:text-green-300'
              : 'text-red-900 dark:text-red-300'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {formData.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-heading font-semibold mb-2">Profile Picture</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Upload a profile picture to personalize your account
            </p>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-heading font-semibold mb-4">Personal Information</h3>
          
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Your full name"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Professional Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., CEO, Entrepreneur, Consultant"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="border-t border-border pt-6">
          <h3 className="font-heading font-semibold mb-4">Account Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Membership Tier:</span>
              <span className="font-medium capitalize">{userData?.membershipTier || 'Member'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since:</span>
              <span className="font-medium">
                {userData?.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : 'Recently'}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-6 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => setFormData({
              displayName: userData?.displayName || '',
              phone: userData?.phone || '',
              title: userData?.title || '',
              bio: userData?.bio || '',
            })}
            className="px-4 py-2 border border-border hover:bg-muted rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
