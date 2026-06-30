'use client';

import { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface IntegrationConfig {
  [key: string]: any;
}

interface Integration {
  name: string;
  description: string;
  config: IntegrationConfig;
}

export function AdminIntegrationsEditor() {
  const { currentUser } = useAuth();
  const [integrations, setIntegrations] = useState<{ [key: string]: Integration }>({
    firebase_admin: {
      name: 'Firebase Admin SDK',
      description: 'Paste your Firebase Admin SDK JSON file here',
      config: {}
    },
    firebase_client: {
      name: 'Firebase Client SDK',
      description: 'Paste your Firebase Client SDK configuration JSON here',
      config: {}
    },
    gmail_smtp: {
      name: 'Gmail SMTP',
      description: 'Email configuration for sending messages',
      config: {}
    },
    stripe: {
      name: 'Stripe',
      description: 'Payment processing keys',
      config: {}
    },
    paypal: {
      name: 'PayPal',
      description: 'PayPal API credentials',
      config: {}
    },
    google_calendar: {
      name: 'Google Calendar',
      description: 'Google Calendar integration',
      config: {}
    },
    microsoft_calendar: {
      name: 'Microsoft Calendar',
      description: 'Microsoft Calendar integration',
      config: {}
    },
    youtube: {
      name: 'YouTube Data API',
      description: 'YouTube channel integration',
      config: {}
    },
    google_places: {
      name: 'Google Places API',
      description: 'Location search and autocomplete',
      config: {}
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [firebaseAdminJson, setFirebaseAdminJson] = useState('');
  const [firebaseClientJson, setFirebaseClientJson] = useState('');

  // Parse Firebase Admin SDK JSON - only when user stops typing
  const handleAdminJsonChange = (jsonStr: string) => {
    setFirebaseAdminJson(jsonStr);
    setError(null);
    
    if (!jsonStr.trim()) {
      // Clear if empty
      setIntegrations(prev => ({
        ...prev,
        firebase_admin: {
          ...prev.firebase_admin,
          config: {}
        }
      }));
      return;
    }

    try {
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
          config: extracted
        }
      }));
    } catch (e) {
      // Silently ignore parse errors - user is still typing
      console.log('[v0] Parsing admin JSON...', e instanceof Error ? e.message : 'error');
    }
  };

  // Parse Firebase Client SDK JSON
  const handleClientJsonChange = (jsonStr: string) => {
    setFirebaseClientJson(jsonStr);
    setError(null);
    
    if (!jsonStr.trim()) {
      // Clear if empty
      setIntegrations(prev => ({
        ...prev,
        firebase_client: {
          ...prev.firebase_client,
          config: {}
        }
      }));
      return;
    }

    try {
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
          config: extracted
        }
      }));
    } catch (e) {
      // Silently ignore parse errors - user is still typing
      console.log('[v0] Parsing client JSON...', e instanceof Error ? e.message : 'error');
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to save integrations (HTTP ${response.status})`);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[v0] Save error:', errorMsg);
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-300 rounded-lg flex gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">Success</p>
            <p className="text-sm text-green-700">All integrations saved successfully!</p>
          </div>
        </div>
      )}

      {/* Firebase Admin SDK */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <span>🔑</span> Firebase Admin SDK
        </h3>
        <p className="text-muted-foreground mb-4">Server-side access to Firestore, Auth, Storage, and Cloud Messaging</p>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium mb-2 block">Paste Service Account JSON</span>
            <textarea
              value={firebaseAdminJson}
              onChange={(e) => handleAdminJsonChange(e.target.value)}
              placeholder="Paste your entire Firebase service account JSON file here..."
              className="w-full h-48 p-3 border rounded-lg font-mono text-sm resize-vertical"
            />
            <p className="text-xs text-muted-foreground mt-1">
              From Firebase Console → Project Settings → Service Accounts → Generate Key
            </p>
          </label>

          {/* Display extracted fields */}
          {integrations.firebase_admin.config.projectId && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-900">✓ Service Account Loaded</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-sm">
                <div>
                  <p className="text-xs text-gray-600">Project ID</p>
                  <p className="font-mono">{integrations.firebase_admin.config.projectId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Client Email</p>
                  <p className="font-mono text-xs">{integrations.firebase_admin.config.clientEmail}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Firebase Client SDK */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <span>🌐</span> Firebase Client SDK
        </h3>
        <p className="text-muted-foreground mb-4">Browser-side SDK for authentication, realtime database, and client storage</p>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium mb-2 block">Paste Firebase Config JSON</span>
            <textarea
              value={firebaseClientJson}
              onChange={(e) => handleClientJsonChange(e.target.value)}
              placeholder="Paste your entire Firebase configuration JSON file here..."
              className="w-full h-48 p-3 border rounded-lg font-mono text-sm resize-vertical"
            />
            <p className="text-xs text-muted-foreground mt-1">
              From Firebase Console → Project Settings → Your apps → Config
            </p>
          </label>

          {/* Display extracted fields */}
          {integrations.firebase_client.config.projectId && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-900">✓ Firebase Config Loaded</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-sm">
                <div>
                  <p className="text-xs text-gray-600">Project ID</p>
                  <p className="font-mono">{integrations.firebase_client.config.projectId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Auth Domain</p>
                  <p className="font-mono text-xs">{integrations.firebase_client.config.authDomain}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Storage Bucket</p>
                  <p className="font-mono text-xs">{integrations.firebase_client.config.storageBucket}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">App ID</p>
                  <p className="font-mono text-xs">{integrations.firebase_client.config.appId}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gmail SMTP */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📧</span> Gmail SMTP
          </h3>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={integrations.gmail_smtp.config.email || ''}
              onChange={(e) => updateConfig('gmail_smtp', 'email', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="App Password"
              value={integrations.gmail_smtp.config.appPassword || ''}
              onChange={(e) => updateConfig('gmail_smtp', 'appPassword', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Sender Name"
              value={integrations.gmail_smtp.config.senderName || ''}
              onChange={(e) => updateConfig('gmail_smtp', 'senderName', e.target.value)}
              className="w-full p-2 border rounded text-sm"
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
              className="w-full p-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="Secret Key"
              value={integrations.stripe.config.secretKey || ''}
              onChange={(e) => updateConfig('stripe', 'secretKey', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="Webhook Secret"
              value={integrations.stripe.config.webhookSecret || ''}
              onChange={(e) => updateConfig('stripe', 'webhookSecret', e.target.value)}
              className="w-full p-2 border rounded text-sm"
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
              className="w-full p-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="Secret"
              value={integrations.paypal.config.secret || ''}
              onChange={(e) => updateConfig('paypal', 'secret', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
            <select
              value={integrations.paypal.config.mode || 'sandbox'}
              onChange={(e) => updateConfig('paypal', 'mode', e.target.value)}
              className="w-full p-2 border rounded text-sm"
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
              className="w-full p-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Calendar ID"
              value={integrations.google_calendar.config.calendarId || ''}
              onChange={(e) => updateConfig('google_calendar', 'calendarId', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        </div>

        {/* Microsoft Calendar */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📆</span> Microsoft Calendar
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Client ID"
              value={integrations.microsoft_calendar.config.clientId || ''}
              onChange={(e) => updateConfig('microsoft_calendar', 'clientId', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="Secret"
              value={integrations.microsoft_calendar.config.secret || ''}
              onChange={(e) => updateConfig('microsoft_calendar', 'secret', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Tenant ID"
              value={integrations.microsoft_calendar.config.tenantId || ''}
              onChange={(e) => updateConfig('microsoft_calendar', 'tenantId', e.target.value)}
              className="w-full p-2 border rounded text-sm"
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
              className="w-full p-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Channel ID"
              value={integrations.youtube.config.channelId || ''}
              onChange={(e) => updateConfig('youtube', 'channelId', e.target.value)}
              className="w-full p-2 border rounded text-sm"
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
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-0 bg-white border-t p-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {Object.values(integrations).filter(i => Object.keys(i.config).length > 0).length} integrations configured
        </div>
        <button
          onClick={saveIntegrations}
          disabled={saving || !currentUser}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
        >
          {saving ? '⏳ Saving...' : '💾 Save All Integrations'}
        </button>
      </div>
    </div>
  );
}
