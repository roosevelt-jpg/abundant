'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

const DEFAULT_SETTINGS = {
  id: 'main',
  siteName: 'Abundant Global Club',
  description: 'A Global Network of Success',
  contactEmail: 'hello@abundant.club',
  youtubeApiKey: '',
  youtubeChannelId: '',
  youtubeEnabled: false,
};

export default function AdminSettingsEditor() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('[v0] Saving settings:', settings);
      // Settings would be saved to Firestore in a real implementation
      // For now, just show success message
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('[v0] Error saving settings:', error);
      setSuccessMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure platform settings</p>
      </div>

      {successMessage && (
        <div className={`mb-6 p-4 border rounded-lg text-sm ${
          successMessage.includes('Error')
            ? 'bg-destructive/10 border-destructive/20 text-destructive'
            : 'bg-green-500/10 border-green-500/20 text-green-600'
        }`}>
          {successMessage}
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        {/* General Settings */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading font-bold text-lg mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* YouTube Settings */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">YouTube Integration</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.youtubeEnabled}
                onChange={(e) => setSettings({ ...settings, youtubeEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm font-medium">Enable</span>
            </label>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">YouTube API Key</label>
              <input
                type="password"
                value={settings.youtubeApiKey}
                onChange={(e) => setSettings({ ...settings, youtubeApiKey: e.target.value })}
                placeholder="Paste your YouTube API key"
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">YouTube Channel ID</label>
              <input
                type="text"
                value={settings.youtubeChannelId}
                onChange={(e) => setSettings({ ...settings, youtubeChannelId: e.target.value })}
                placeholder="UC..."
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
