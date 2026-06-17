'use client';

import { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';
import { getSettings, updateSettings, initializeSettings } from '@/lib/db-service';
import { Settings } from '@/lib/types';

export default function AdminSettingsEditor() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      let sett = await getSettings();
      if (!sett) {
        sett = await initializeSettings();
      }
      setSettings(sett);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await updateSettings(settings);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof Settings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const handleIntegrationToggle = (service: string, enabled: boolean) => {
    if (settings) {
      setSettings({
        ...settings,
        integrations: {
          ...settings.integrations,
          [service]: { ...settings.integrations[service as keyof typeof settings.integrations], configured: enabled }
        }
      });
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="text-center py-12 text-destructive">Failed to load settings</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure platform settings with live Firestore persistence</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
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
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <input
                type="text"
                value={settings.description}
                onChange={(e) => handleSettingChange('description', e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => handleSettingChange('phone', e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => handleSettingChange('address', e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading font-bold text-lg mb-4">Integrations</h2>
          <div className="space-y-4">
            {[
              { key: 'stripe', name: 'Stripe', desc: 'Payment processing for subscriptions' },
              { key: 'sendgrid', name: 'SendGrid', desc: 'Email delivery service' },
              { key: 'googlePlaces', name: 'Google Places', desc: 'Location and address API' },
              { key: 'whatsapp', name: 'WhatsApp', desc: 'WhatsApp messaging integration' }
            ].map((integration) => (
              <div key={integration.key} className="p-4 bg-background rounded-lg border border-border flex items-center justify-between">
                <div>
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-sm text-muted-foreground">{integration.desc}</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.integrations[integration.key as keyof typeof settings.integrations]?.configured || false}
                    onChange={(e) => handleIntegrationToggle(integration.key, e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">
                    {settings.integrations[integration.key as keyof typeof settings.integrations]?.configured ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading font-bold text-lg mb-4">Social Media Links</h2>
          <p className="text-sm text-muted-foreground mb-4">Add your social media profiles. Leave blank to hide from public pages.</p>
          <div className="space-y-4">
            {[
              { key: 'email', label: 'Email Address', placeholder: 'hello@example.com' },
              { key: 'whatsapp', label: 'WhatsApp Number', placeholder: '+1234567890' },
              { key: 'facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
              { key: 'twitter', label: 'Twitter URL', placeholder: 'https://twitter.com/...' },
              { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/company/...' },
              { key: 'instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
              { key: 'youtube', label: 'YouTube URL', placeholder: 'https://youtube.com/@...' },
              { key: 'tiktok', label: 'TikTok URL', placeholder: 'https://tiktok.com/@...' },
              { key: 'telegram', label: 'Telegram URL', placeholder: 'https://t.me/...' }
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2">{label}</label>
                <input
                  type="text"
                  value={settings.socialLinks?.[key as keyof typeof settings.socialLinks] || ''}
                  onChange={(e) => 
                    handleSettingChange('socialLinks', {
                      ...settings.socialLinks,
                      [key]: e.target.value
                    })
                  }
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
