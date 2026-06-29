'use client';

import { useState } from 'react';
import { Check, X, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface IntegrationConfig {
  [key: string]: any;
}

interface Integration {
  name: string;
  description: string;
  jsonPaste?: boolean;
  config: IntegrationConfig;
  status: 'connected' | 'partial' | 'error' | 'not-configured';
}

export function AdminIntegrationsEditor() {
  const { currentUser } = useAuth();
  const [integrations, setIntegrations] = useState<{ [key: string]: Integration }>({
    firebase_admin: {
      name: 'Firebase Admin SDK',
      description: 'Paste your Firebase Admin SDK JSON file here',
      jsonPaste: true,
      status: 'not-configured',
      config: {}
    },
    firebase_client: {
      name: 'Firebase Client SDK',
      description: 'Paste your Firebase Client SDK configuration JSON here',
      jsonPaste: true,
      status: 'not-configured',
      config: {}
    },
    gmail_smtp: {
      name: 'Gmail SMTP',
      description: 'Email configuration for sending messages',
      status: 'not-configured',
      config: {}
    },
    stripe: {
      name: 'Stripe',
      description: 'Payment processing keys',
      status: 'not-configured',
      config: {}
    },
    paypal: {
      name: 'PayPal',
      description: 'PayPal API credentials',
      status: 'not-configured',
      config: {}
    },
    google_calendar: {
      name: 'Google Calendar',
      description: 'Google Calendar integration',
      status: 'not-configured',
      config: {}
    },
    microsoft_calendar: {
      name: 'Microsoft Calendar',
      description: 'Microsoft Calendar integration',
      status: 'not-configured',
      config: {}
    },
    youtube: {
      name: 'YouTube Data API',
      description: 'YouTube channel integration',
      status: 'not-configured',
      config: {}
    },
    google_places: {
      name: 'Google Places API',
      description: 'Location search and autocomplete',
      status: 'not-configured',
      config: {}
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [firebaseAdminJson, setFirebaseAdminJson] = useState('');
  const [firebaseClientJson, setFirebaseClientJson] = useState('');

  // Parse Firebase Admin SDK JSON
  const parseFirebaseAdminJson = (jsonStr: string) => {
    try {
      setError(null);
      const json = JSON.parse(jsonStr);
      
      // Extract expected fields from service account JSON
      const extracted: IntegrationConfig = {
        projectId: json.project_id || '',
        privateKey: json.private_key || '',
        clientEmail: json.client_email || '',
        type: json.type || 'service_account'
      };

      // Update integrations with extracted data
      setIntegrations(prev => ({
        ...prev,
        firebase_admin: {
          ...prev.firebase_admin,
          config: extracted,
          status: extracted.projectId && extracted.privateKey ? 'connected' : 'partial'
        }
      }));

      setFirebaseAdminJson(jsonStr);
      return true;
    } catch (e) {
      setError(`Invalid Firebase Admin JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return false;
    }
  };

  // Parse Firebase Client SDK JSON
  const parseFirebaseClientJson = (jsonStr: string) => {
    try {
      setError(null);
      const json = JSON.parse(jsonStr);
      
      // Extract expected fields from Firebase config
      const extracted: IntegrationConfig = {
        apiKey: json.apiKey || '',
        authDomain: json.authDomain || '',
        projectId: json.projectId || '',
        storageBucket: json.storageBucket || '',
        messagingSenderId: json.messagingSenderId || '',
        appId: json.appId || '',
        measurementId: json.measurementId || ''
      };

      // Update integrations with extracted data
      setIntegrations(prev => ({
        ...prev,
        firebase_client: {
          ...prev.firebase_client,
          config: extracted,
          status: extracted.apiKey && extracted.projectId ? 'connected' : 'partial'
        }
      }));

      setFirebaseClientJson(jsonStr);
      return true;
    } catch (e) {
      setError(`Invalid Firebase Client JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return false;
    }
  };

  // Update integration config value
  const updateConfig = (integrationKey: string, field: string, value: string) => {
    setIntegrations(prev => ({
      ...prev,
      [integrationKey]: {
        ...prev[integrationKey],
        config: {
          ...prev[integrationKey].config,
          [field]: value
        }
      }
    }));
  };

  // Save all integrations
  const saveIntegrations = async () => {
    if (!currentUser) {
      setError('Not authenticated');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/integrations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ integrations })
      });

      // Check content type to ensure we got JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[v0] Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to save integrations`);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[v0] Save error:', errorMsg);
      setError(`Save error: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-destructive font-medium">Error</p>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {saveSuccess && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg flex gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">Success</p>
            <p className="text-sm text-green-700">All integrations saved successfully</p>
          </div>
        </div>
      )}

      {/* Firebase Admin SDK */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <span className="text-2xl">🔑</span>
            {integrations.firebase_admin.name}
          </h3>
          <p className="text-muted-foreground">{integrations.firebase_admin.description}</p>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium mb-2 block">Firebase Service Account JSON</span>
            <textarea
              value={firebaseAdminJson}
              onChange={(e) => parseFirebaseAdminJson(e.target.value)}
              placeholder='Paste your Firebase service account JSON file here (from Firebase Console → Project Settings → Service Accounts → Generate Key)'
              className="w-full h-40 p-3 border rounded-lg font-mono text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-2">
              The JSON file will be automatically parsed. All fields will be extracted.
            </p>
          </label>

          {/* Extracted fields display */}
          {integrations.firebase_admin.config.projectId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium">Project ID</label>
                <input
                  type="text"
                  value={integrations.firebase_admin.config.projectId}
                  onChange={(e) => updateConfig('firebase_admin', 'projectId', e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg bg-slate-50"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium">Client Email</label>
                <input
                  type="text"
                  value={integrations.firebase_admin.config.clientEmail}
                  onChange={(e) => updateConfig('firebase_admin', 'clientEmail', e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg bg-slate-50"
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Private Key (encrypted)</label>
                <div className="text-xs text-green-600 mt-1 p-2 bg-green-50 rounded">
                  ✓ Private key loaded and will be encrypted before storage
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Firebase Client SDK */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <span className="text-2xl">🌐</span>
            {integrations.firebase_client.name}
          </h3>
          <p className="text-muted-foreground">{integrations.firebase_client.description}</p>
        </div>

        <div className="space-y-3">
          <label className="block" key="firebase-client-label">
            <span className="text-sm font-medium mb-2 block">Firebase Config JSON</span>
            <textarea
              key="firebase-client-textarea"
              value={firebaseClientJson}
              onChange={(e) => parseFirebaseClientJson(e.target.value)}
              placeholder='Paste your Firebase configuration JSON here (from Firebase Console → Project Settings → Your apps → Config)'
              className="w-full h-40 p-3 border rounded-lg font-mono text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary resize-vertical"
            />
            <p className="text-xs text-muted-foreground mt-2">
              The JSON will be automatically parsed to extract all required credentials.
            </p>
          </label>

          {/* Extracted fields display */}
          {integrations.firebase_client.config.projectId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium">Project ID</label>
                <input
                  type="text"
                  value={integrations.firebase_client.config.projectId}
                  className="w-full mt-1 p-2 border rounded-lg bg-slate-50"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium">Auth Domain</label>
                <input
                  type="text"
                  value={integrations.firebase_client.config.authDomain}
                  className="w-full mt-1 p-2 border rounded-lg bg-slate-50"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium">Storage Bucket</label>
                <input
                  type="text"
                  value={integrations.firebase_client.config.storageBucket}
                  className="w-full mt-1 p-2 border rounded-lg bg-slate-50"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium">Messaging Sender ID</label>
                <input
                  type="text"
                  value={integrations.firebase_client.config.messagingSenderId}
                  className="w-full mt-1 p-2 border rounded-lg bg-slate-50"
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">API Key (encrypted)</label>
                <div className="text-xs text-green-600 mt-1 p-2 bg-green-50 rounded">
                  ✓ API key loaded and will be encrypted before storage
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other Integrations Quick Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gmail SMTP */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📧</span> Gmail SMTP
          </h3>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={integrations.gmail_smtp.config.email || ''}
              onChange={(e) => updateConfig('gmail_smtp', 'email', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
            <input
              type="password"
              placeholder="App Password"
              value={integrations.gmail_smtp.config.appPassword || ''}
              onChange={(e) => updateConfig('gmail_smtp', 'appPassword', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Sender Name"
              value={integrations.gmail_smtp.config.senderName || ''}
              onChange={(e) => updateConfig('gmail_smtp', 'senderName', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Stripe */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>💳</span> Stripe
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Publishable Key"
              value={integrations.stripe.config.publishableKey || ''}
              onChange={(e) => updateConfig('stripe', 'publishableKey', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
            <input
              type="password"
              placeholder="Secret Key"
              value={integrations.stripe.config.secretKey || ''}
              onChange={(e) => updateConfig('stripe', 'secretKey', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
            <input
              type="password"
              placeholder="Webhook Secret"
              value={integrations.stripe.config.webhookSecret || ''}
              onChange={(e) => updateConfig('stripe', 'webhookSecret', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* PayPal */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🅿️</span> PayPal
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Client ID"
              value={integrations.paypal.config.clientId || ''}
              onChange={(e) => updateConfig('paypal', 'clientId', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
            <input
              type="password"
              placeholder="Secret"
              value={integrations.paypal.config.secret || ''}
              onChange={(e) => updateConfig('paypal', 'secret', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
            <select
              value={integrations.paypal.config.mode || 'sandbox'}
              onChange={(e) => updateConfig('paypal', 'mode', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="sandbox">Sandbox</option>
              <option value="live">Live</option>
            </select>
          </div>
        </div>

        {/* Google Calendar */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📅</span> Google Calendar
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="API Key"
              value={integrations.google_calendar.config.apiKey || ''}
              onChange={(e) => updateConfig('google_calendar', 'apiKey', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Calendar ID"
              value={integrations.google_calendar.config.calendarId || ''}
              onChange={(e) => updateConfig('google_calendar', 'calendarId', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* YouTube */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🎬</span> YouTube Data API
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="API Key"
              value={integrations.youtube.config.apiKey || ''}
              onChange={(e) => updateConfig('youtube', 'apiKey', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Channel ID"
              value={integrations.youtube.config.channelId || ''}
              onChange={(e) => updateConfig('youtube', 'channelId', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Google Places */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📍</span> Google Places API
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="API Key"
              value={integrations.google_places.config.apiKey || ''}
              onChange={(e) => updateConfig('google_places', 'apiKey', e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-0 bg-white border-t p-4 flex justify-between items-center rounded-lg">
        <div className="text-sm text-muted-foreground">
          {Object.values(integrations).filter(i => Object.keys(i.config).length > 0).length} integrations configured
        </div>
        <button
          onClick={saveIntegrations}
          disabled={saving || !currentUser}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Integrations'}
        </button>
      </div>
    </div>
  );
}
