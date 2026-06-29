'use client';

import { useState, useEffect } from 'react';
import { Check, X, Eye, EyeOff, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface IntegrationConfig {
  [key: string]: any;
}

interface IntegrationField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'checkbox';
  placeholder?: string;
  sensitive?: boolean;
}

interface Integration {
  name: string;
  description: string;
  fields: IntegrationField[];
  config: IntegrationConfig;
  status: 'connected' | 'partial' | 'error' | 'not-configured';
}

export function AdminIntegrationsEditor() {
  const { currentUser } = useAuth();
  const [integrations, setIntegrations] = useState<{ [key: string]: Integration }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize integrations structure
  useEffect(() => {
    const integs: { [key: string]: Integration } = {
      firebase_admin: {
        name: 'Firebase Admin SDK',
        description: 'Server-side access to Firestore, Auth, Storage, and Cloud Messaging',
        status: 'not-configured',
        config: {},
        fields: [
          { key: 'projectId', label: 'Project ID', type: 'text', placeholder: 'your-project-id' },
          { key: 'privateKey', label: 'Private Key', type: 'password', placeholder: '-----BEGIN PRIVATE KEY-----...', sensitive: true },
          { key: 'clientEmail', label: 'Client Email', type: 'email', placeholder: 'firebase-adminsdk-xxx@project.iam.gserviceaccount.com', sensitive: true },
        ]
      },
      firebase_client: {
        name: 'Firebase Client SDK',
        description: 'Browser-side SDK for authentication, database, and storage',
        status: 'not-configured',
        config: {},
        fields: [
          { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...', sensitive: true },
          { key: 'authDomain', label: 'Auth Domain', type: 'text', placeholder: 'your-project.firebaseapp.com' },
          { key: 'projectId', label: 'Project ID', type: 'text', placeholder: 'your-project-id' },
          { key: 'storageBucket', label: 'Storage Bucket', type: 'text', placeholder: 'your-project.appspot.com' },
          { key: 'messagingSenderId', label: 'Messaging Sender ID', type: 'text', placeholder: '123456789' },
          { key: 'appId', label: 'App ID', type: 'text', placeholder: '1:123456789:web:abc123' },
        ]
      },
      gmail_smtp: {
        name: 'Gmail SMTP',
        description: 'Send emails through Gmail account',
        status: 'not-configured',
        config: {},
        fields: [
          { key: 'email', label: 'Email Address', type: 'email', placeholder: 'your-email@gmail.com' },
          { key: 'appPassword', label: 'App Password', type: 'password', placeholder: 'xxxx xxxx xxxx xxxx', sensitive: true },
          { key: 'senderName', label: 'Sender Name', type: 'text', placeholder: 'Abundant Global Club' },
        ]
      },
      stripe: {
        name: 'Stripe',
        description: 'Payment processing',
        status: 'not-configured',
        config: {},
        fields: [
          { key: 'publishableKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...' },
          { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...', sensitive: true },
          { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', sensitive: true },
        ]
      },
      paypal: {
        name: 'PayPal',
        description: 'PayPal payment integration',
        status: 'not-configured',
        config: {},
        fields: [
          { key: 'clientId', label: 'Client ID', type: 'password', placeholder: 'AQd...', sensitive: true },
          { key: 'secret', label: 'Secret', type: 'password', placeholder: 'EL3...', sensitive: true },
          { key: 'mode', label: 'Mode', type: 'text', placeholder: 'sandbox or live' },
        ]
      },
      google_calendar: {
        name: 'Google Calendar',
        description: 'Sync events with Google Calendar',
        status: 'not-configured',
        config: {},
        fields: [
          { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...', sensitive: true },
          { key: 'calendarId', label: 'Calendar ID', type: 'text', placeholder: 'primary or email@gmail.com' },
        ]
      },
      microsoft_calendar: {
        name: 'Microsoft Calendar',
        description: 'Sync events with Microsoft Outlook',
        status: 'not-configured',
        config: {},
        fields: [
          { key: 'clientId', label: 'Client ID', type: 'text', placeholder: '...' },
          { key: 'secret', label: 'Secret', type: 'password', placeholder: '...', sensitive: true },
          { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'common' },
        ]
      },
      youtube: {
        name: 'YouTube Data API',
        description: 'Fetch videos from YouTube channel',
        status: 'not-configured',
        config: {},
        fields: [
          { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...', sensitive: true },
          { key: 'channelId', label: 'Channel ID', type: 'text', placeholder: 'UCxxxxx' },
        ]
      },
      google_places: {
        name: 'Google Places API',
        description: 'Location autocomplete and place details',
        status: 'not-configured',
        config: {},
        fields: [
          { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...', sensitive: true },
        ]
      },
    };

    setIntegrations(integs);
    setLoading(false);
  }, []);

  const handleFieldChange = (integrationKey: string, fieldKey: string, value: any) => {
    setIntegrations(prev => ({
      ...prev,
      [integrationKey]: {
        ...prev[integrationKey],
        config: {
          ...prev[integrationKey].config,
          [fieldKey]: value
        }
      }
    }));
  };

  const saveIntegrations = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);

      const token = currentUser ? await currentUser.getIdToken() : null;
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Prepare integrations data for storage
      const integrationsData: { [key: string]: any } = {};
      Object.entries(integrations).forEach(([key, integration]) => {
        integrationsData[key] = integration.config;
      });

      console.log('[v0] Saving integrations...', integrationsData);

      const response = await fetch('/api/integrations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          integrations: integrationsData
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        setError(null);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || `Failed to save integrations (${response.status})`);
      }
    } catch (err) {
      console.error('[v0] Error saving integrations:', err);
      setError(`Error saving integrations: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <p className="mt-4 text-muted-foreground">Loading integrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">Integrations saved successfully!</p>
        </div>
      )}

      {/* Firebase Admin SDK */}
      <IntegrationSection
        integration={integrations.firebase_admin}
        integrationKey="firebase_admin"
        onFieldChange={handleFieldChange}
        showSecrets={showSecrets}
        setShowSecrets={setShowSecrets}
      />

      {/* Firebase Client SDK */}
      <IntegrationSection
        integration={integrations.firebase_client}
        integrationKey="firebase_client"
        onFieldChange={handleFieldChange}
        showSecrets={showSecrets}
        setShowSecrets={setShowSecrets}
      />

      {/* Gmail SMTP */}
      <IntegrationSection
        integration={integrations.gmail_smtp}
        integrationKey="gmail_smtp"
        onFieldChange={handleFieldChange}
        showSecrets={showSecrets}
        setShowSecrets={setShowSecrets}
      />

      {/* Stripe */}
      <IntegrationSection
        integration={integrations.stripe}
        integrationKey="stripe"
        onFieldChange={handleFieldChange}
        showSecrets={showSecrets}
        setShowSecrets={setShowSecrets}
      />

      {/* PayPal */}
      <IntegrationSection
        integration={integrations.paypal}
        integrationKey="paypal"
        onFieldChange={handleFieldChange}
        showSecrets={showSecrets}
        setShowSecrets={setShowSecrets}
      />

      {/* Google Calendar */}
      <IntegrationSection
        integration={integrations.google_calendar}
        integrationKey="google_calendar"
        onFieldChange={handleFieldChange}
        showSecrets={showSecrets}
        setShowSecrets={setShowSecrets}
      />

      {/* Microsoft Calendar */}
      <IntegrationSection
        integration={integrations.microsoft_calendar}
        integrationKey="microsoft_calendar"
        onFieldChange={handleFieldChange}
        showSecrets={showSecrets}
        setShowSecrets={setShowSecrets}
      />

      {/* YouTube */}
      <IntegrationSection
        integration={integrations.youtube}
        integrationKey="youtube"
        onFieldChange={handleFieldChange}
        showSecrets={showSecrets}
        setShowSecrets={setShowSecrets}
      />

      {/* Google Places */}
      <IntegrationSection
        integration={integrations.google_places}
        integrationKey="google_places"
        onFieldChange={handleFieldChange}
        showSecrets={showSecrets}
        setShowSecrets={setShowSecrets}
      />

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-border">
        <button
          onClick={saveIntegrations}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Integrations'}
        </button>
      </div>
    </div>
  );
}

interface IntegrationSectionProps {
  integration?: Integration;
  integrationKey: string;
  onFieldChange: (integrationKey: string, fieldKey: string, value: any) => void;
  showSecrets: { [key: string]: boolean };
  setShowSecrets: (show: { [key: string]: boolean }) => void;
}

function IntegrationSection({
  integration,
  integrationKey,
  onFieldChange,
  showSecrets,
  setShowSecrets
}: IntegrationSectionProps) {
  if (!integration) return null;

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{integration.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integration.fields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-2">
              {field.label}
            </label>
            {field.type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={integration.config[field.key] || false}
                onChange={e => onFieldChange(integrationKey, field.key, e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
            ) : (
              <div className="relative">
                <input
                  type={
                    field.type === 'password' && !showSecrets[`${integrationKey}-${field.key}`]
                      ? 'password'
                      : 'text'
                  }
                  placeholder={field.placeholder}
                  value={integration.config[field.key] || ''}
                  onChange={e => onFieldChange(integrationKey, field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {field.type === 'password' && (
                  <button
                    onClick={() =>
                      setShowSecrets({
                        ...showSecrets,
                        [`${integrationKey}-${field.key}`]: !showSecrets[`${integrationKey}-${field.key}`]
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecrets[`${integrationKey}-${field.key}`] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
