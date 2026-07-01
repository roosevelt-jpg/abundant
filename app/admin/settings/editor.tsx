'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Save } from 'lucide-react';
import type { Settings } from '@/lib/types';

export default function AdminSettingsEditor() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<Partial<Settings> | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/settings', { 
        cache: 'no-store',
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        setError(`Failed to load settings: ${response.statusText}`);
        setSettings({});
      }
    } catch (error) {
      console.error('[v0] Error fetching settings:', error);
      setError('Failed to load settings. Please try again.');
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !currentUser) return;

    try {
      setSaving(true);
      const token = await currentUser.getIdToken();

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setSuccessMessage('Error saving settings');
      }
    } catch (error) {
      console.error('[v0] Error saving settings:', error);
      setSuccessMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive font-medium">{error}</p>
          <button
            onClick={fetchSettings}
            className="mt-3 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 text-sm font-medium"
          >
            Retry Loading Settings
          </button>
        </div>
      </div>
    );
  }

  if (loading || !settings) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings({ ...settings, ...updates });
  };

  const updateSocialLinks = (key: string, value: string) => {
    setSettings({
      ...settings,
      socialLinks: {
        ...settings.socialLinks,
        [key]: value,
      },
    });
  };

  const updateIntegrations = (service: string, data: any) => {
    const integrations = (settings?.integrations as any) || {};
    setSettings({
      ...settings,
      integrations: {
        ...integrations,
        [service]: data,
      },
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure platform settings and integrations</p>
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
                value={settings.siteName || ''}
                onChange={(e) => updateSettings({ siteName: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={settings.description || ''}
                onChange={(e) => updateSettings({ description: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => updateSettings({ contactEmail: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => updateSettings({ phone: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                value={settings.address || ''}
                onChange={(e) => updateSettings({ address: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading font-bold text-lg mb-4">Social Media Links</h2>
          <div className="space-y-4">
            {['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'telegram'].map(platform => (
              <div key={platform}>
                <label className="block text-sm font-medium mb-2 capitalize">{platform}</label>
                <input
                  type="url"
                  placeholder={`https://${platform}.com/yourprofile`}
                  value={settings.socialLinks?.[platform as keyof typeof settings.socialLinks] || ''}
                  onChange={(e) => updateSocialLinks(platform, e.target.value)}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp</label>
              <input
                type="tel"
                placeholder="+1234567890"
                value={settings.socialLinks?.whatsapp || ''}
                onChange={(e) => updateSocialLinks('whatsapp', e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Integrations Management */}
        <div className="p-6 bg-card rounded-xl border border-accent">
          <h2 className="font-heading font-bold text-lg mb-2">Integrations Management</h2>
          <p className="text-sm text-muted-foreground mb-4">
            All integrations including Firebase, Gmail SMTP, Stripe, PayPal, Google/Microsoft/Apple Calendar, YouTube Data API, and Google Places have been moved to a dedicated management page.
          </p>
          <Link
            href="/admin/integrations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 font-medium text-sm"
          >
            Manage Integrations →
          </Link>
        </div>

        {/* Hero Slider Configuration */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading font-bold text-lg mb-4">Hero Slider</h2>
          <div className="p-4 bg-accent/10 border border-accent rounded-lg">
            <p className="text-sm font-medium">Hero Slider management has been moved to a dedicated page.</p>
            <p className="text-sm text-muted-foreground mt-2">Go to <strong>Admin → Hero Slider</strong> to manage slides, images, videos, speed, and transitions.</p>
          </div>
        </div>

        {/* YouTube Widget Configuration */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">YouTube Widget</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.youtubeSection?.enabled || false}
                onChange={(e) => updateSettings({ youtubeSection: { ...settings.youtubeSection, enabled: e.target.checked } })}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm font-medium">Enable</span>
            </label>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Section Title</label>
              <input
                type="text"
                value={settings.youtubeSection?.title || 'Featured Videos'}
                onChange={(e) => updateSettings({ youtubeSection: { ...settings.youtubeSection, title: e.target.value } })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Featured Videos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Section Description</label>
              <textarea
                value={settings.youtubeSection?.description || ''}
                onChange={(e) => updateSettings({ youtubeSection: { ...settings.youtubeSection, description: e.target.value } })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                rows={3}
                placeholder="Description (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Videos Per Page</label>
              <input
                type="number"
                min="1"
                max="12"
                value={settings.youtubeSection?.videosPerPage || 3}
                onChange={(e) => updateSettings({ youtubeSection: { ...settings.youtubeSection, videosPerPage: parseInt(e.target.value) } })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="3"
              />
            </div>
            <p className="text-xs text-muted-foreground">Configure YouTube API key and Channel ID in the YouTube Integration section above.</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors font-semibold"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
