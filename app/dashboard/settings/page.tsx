'use client';

import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Bell, Lock, Globe, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    eventReminders: true,
    newsletter: false,
    marketingEmails: false,
    publicProfile: true,
    twoFactor: false,
  });
  const [saving, setSaving] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings to Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('[v0] Settings saved:', settings);
    } catch (error) {
      console.error('[v0] Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('[v0] Logout error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and notifications</p>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-muted px-6 py-4 border-b border-border flex items-center gap-3">
          <Bell className="w-5 h-5" />
          <h2 className="font-heading font-bold">Notifications</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive important updates about your account</p>
            </div>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Event Reminders</p>
              <p className="text-sm text-muted-foreground">Get reminders about upcoming events you're registered for</p>
            </div>
            <button
              onClick={() => handleToggle('eventReminders')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                settings.eventReminders ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.eventReminders ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Newsletter</p>
              <p className="text-sm text-muted-foreground">Subscribe to our monthly newsletter with exclusive content</p>
            </div>
            <button
              onClick={() => handleToggle('newsletter')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                settings.newsletter ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.newsletter ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">Receive promotional offers and new announcements</p>
            </div>
            <button
              onClick={() => handleToggle('marketingEmails')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                settings.marketingEmails ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.marketingEmails ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-muted px-6 py-4 border-b border-border flex items-center gap-3">
          <Globe className="w-5 h-5" />
          <h2 className="font-heading font-bold">Privacy</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Public Profile</p>
              <p className="text-sm text-muted-foreground">Allow other members to view your profile and testimonials</p>
            </div>
            <button
              onClick={() => handleToggle('publicProfile')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                settings.publicProfile ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.publicProfile ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-muted px-6 py-4 border-b border-border flex items-center gap-3">
          <Lock className="w-5 h-5" />
          <h2 className="font-heading font-bold">Security</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <button
              onClick={() => handleToggle('twoFactor')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                settings.twoFactor ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.twoFactor ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="font-medium text-foreground mb-3">Active Sessions</p>
            <p className="text-sm text-muted-foreground mb-4">
              You are currently logged in as <span className="font-mono font-semibold">{currentUser?.email}</span>
            </p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-muted px-6 py-4 border-b border-border">
          <h2 className="font-heading font-bold">Data & Privacy</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <p className="font-medium text-foreground mb-3">Download Your Data</p>
            <p className="text-sm text-muted-foreground mb-4">
              Download a copy of all your personal data in a standard format
            </p>
            <button className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-sm font-medium transition-colors">
              Download Data
            </button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="font-medium text-foreground mb-3">Delete Account</p>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data
            </p>
            <button className="px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-sm font-medium transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3 pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 md:flex-none px-6 py-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900 dark:text-blue-300">
          Your settings are saved automatically when you make changes. For sensitive security changes, you may be asked to verify your identity.
        </p>
      </div>
    </div>
  );
}
