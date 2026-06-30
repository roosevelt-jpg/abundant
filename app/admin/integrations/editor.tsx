'use client';

import { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ConfigType {
  [key: string]: any;
}

interface ConfigsState {
  firebaseAdmin: ConfigType;
  firebaseClient: ConfigType;
  gmailSmtp: ConfigType;
  stripe: ConfigType;
  paypal: ConfigType;
  googleCalendar: ConfigType;
  microsoftCalendar: ConfigType;
  youtube: ConfigType;
  googlePlaces: ConfigType;
}

export function AdminIntegrationsEditor() {
  const { currentUser } = useAuth();
  const [configs, setConfigs] = useState<ConfigsState>({
    firebaseAdmin: {},
    firebaseClient: {},
    gmailSmtp: {},
    stripe: {},
    paypal: {},
    googleCalendar: {},
    microsoftCalendar: {},
    youtube: {},
    googlePlaces: {}
  });

  const [firebaseAdminJson, setFirebaseAdminJson] = useState('');
  const [firebaseClientJson, setFirebaseClientJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Parse Firebase Admin SDK JSON
  useEffect(() => {
    if (firebaseAdminJson.trim()) {
      try {
        const parsed = extractJsonFromJs(firebaseAdminJson);
        setConfigs(prev => ({
          ...prev,
          firebaseAdmin: {
            projectId: parsed.project_id || '',
            clientEmail: parsed.client_email || '',
            privateKey: parsed.private_key || ''
          }
        }));
        setError(null);
      } catch (e) {
        // Silent parse failure - user is still typing
      }
    } else {
      setConfigs(prev => ({
        ...prev,
        firebaseAdmin: {}
      }));
    }
  }, [firebaseAdminJson]);

  // Helper to extract JSON from JavaScript code
  const extractJsonFromJs = (text: string): any => {
    try {
      // Try direct JSON parse first
      return JSON.parse(text);
    } catch (e) {
      // Step 1: Remove // comments (but not in strings)
      let lines = text.split('\n');
      let cleaned = lines.map(line => {
        let inString = false;
        let escape = false;
        for (let i = 0; i < line.length - 1; i++) {
          if (escape) {
            escape = false;
            continue;
          }
          if (line[i] === '\\') {
            escape = true;
            continue;
          }
          if (line[i] === '"') {
            inString = !inString;
            continue;
          }
          if (!inString && line[i] === '/' && line[i + 1] === '/') {
            return line.substring(0, i);
          }
        }
        return line;
      }).join('\n');

      // Step 2: Remove /* */ comments
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

      // Step 3: Extract just the { } object - find first { and last }
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        throw new Error('No JSON object found');
      }

      let jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
      
      // Step 4: Remove trailing commas before } or ]
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      
      // Step 5: Parse
      return JSON.parse(jsonStr);
    }
  };

  // Parse Firebase Client SDK JSON
  useEffect(() => {
    if (firebaseClientJson.trim()) {
      try {
        const parsed = extractJsonFromJs(firebaseClientJson);
        setConfigs(prev => ({
          ...prev,
          firebaseClient: {
            apiKey: parsed.apiKey || '',
            authDomain: parsed.authDomain || '',
            projectId: parsed.projectId || '',
            storageBucket: parsed.storageBucket || '',
            messagingSenderId: parsed.messagingSenderId || '',
            appId: parsed.appId || ''
          }
        }));
        setError(null);
      } catch (e) {
        // Silent parse failure - user is still typing
      }
    } else {
      setConfigs(prev => ({
        ...prev,
        firebaseClient: {}
      }));
    }
  }, [firebaseClientJson]);

  const updateConfig = (key: string, field: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [key]: {
        ...prev[key as keyof typeof configs],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!currentUser) {
      setError('Not authenticated');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      
      const payload = {
        firebaseAdmin: configs.firebaseAdmin,
        firebaseClient: configs.firebaseClient,
        gmailSmtp: configs.gmailSmtp,
        stripe: configs.stripe,
        paypal: configs.paypal,
        googleCalendar: configs.googleCalendar,
        microsoftCalendar: configs.microsoftCalendar,
        youtube: configs.youtube,
        googlePlaces: configs.googlePlaces
      };

      const response = await fetch('/api/integrations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[v0] API error response:', errorText);
        throw new Error(`HTTP ${response.status}: Failed to save`);
      }

      const data = await response.json();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[v0] Save failed:', msg);
    } finally {
      setSaving(false);
    }
  };

  // Count integrations that have at least one non-empty field
  const countConfigurations = Object.values(configs).filter(config => {
    // Check if config has any non-empty values
    return Object.values(config).some(value => value && value.toString().trim().length > 0);
  }).length;
  
  const hasConfigs = countConfigurations > 0;

  return (
    <div className="space-y-6 p-8 max-w-6xl mx-auto">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-300 rounded-lg flex gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">Success</p>
            <p className="text-sm text-green-700">All integrations saved successfully!</p>
          </div>
        </div>
      )}

      {/* Firebase Admin SDK */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">🔑 Firebase Admin SDK</h3>
        <p className="text-sm text-gray-600 mb-4">Server-side access to Firestore, Auth, Storage</p>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Service Account JSON</label>
            <textarea
              value={firebaseAdminJson}
              onChange={(e) => setFirebaseAdminJson(e.target.value)}
              placeholder="Paste entire Firebase service account JSON..."
              className="w-full h-40 p-3 border rounded-lg font-mono text-xs resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">From Firebase Console → Project Settings → Service Accounts → Generate Key</p>
          </div>

          {/* Display extracted Firebase Admin fields */}
          {configs.firebaseAdmin.projectId && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="w-4 h-4" />
                <span>Project ID: {configs.firebaseAdmin.projectId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="w-4 h-4" />
                <span>Client Email: {configs.firebaseAdmin.clientEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="w-4 h-4" />
                <span>Private Key: ••••••••••••••••</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Firebase Client SDK */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">🌐 Firebase Client SDK</h3>
        <p className="text-sm text-gray-600 mb-4">Browser-side configuration for authentication and database</p>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Firebase Config JSON</label>
            <textarea
              value={firebaseClientJson}
              onChange={(e) => setFirebaseClientJson(e.target.value)}
              placeholder="Paste entire Firebase configuration JSON..."
              className="w-full h-40 p-3 border rounded-lg font-mono text-xs resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">From Firebase Console → Project Settings → Your apps → Web → Config</p>
          </div>

          {/* Display extracted Firebase Client fields */}
          {configs.firebaseClient.projectId && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="w-4 h-4" />
                <span>Project ID: {configs.firebaseClient.projectId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="w-4 h-4" />
                <span>Auth Domain: {configs.firebaseClient.authDomain}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="w-4 h-4" />
                <span>API Key: {configs.firebaseClient.apiKey?.substring(0, 10)}...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other Integrations - Compact cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gmail SMTP */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">📧 Gmail SMTP</h4>
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Email address"
              value={configs.gmailSmtp.email || ''}
              onChange={(e) => updateConfig('gmailSmtp', 'email', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="App password"
              value={configs.gmailSmtp.appPassword || ''}
              onChange={(e) => updateConfig('gmailSmtp', 'appPassword', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Sender name"
              value={configs.gmailSmtp.senderName || ''}
              onChange={(e) => updateConfig('gmailSmtp', 'senderName', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        {/* Stripe */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">💳 Stripe</h4>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Publishable key"
              value={configs.stripe.publishableKey || ''}
              onChange={(e) => updateConfig('stripe', 'publishableKey', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="Secret key"
              value={configs.stripe.secretKey || ''}
              onChange={(e) => updateConfig('stripe', 'secretKey', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="Webhook secret"
              value={configs.stripe.webhookSecret || ''}
              onChange={(e) => updateConfig('stripe', 'webhookSecret', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        {/* PayPal */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">🅿️ PayPal</h4>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Client ID"
              value={configs.paypal.clientId || ''}
              onChange={(e) => updateConfig('paypal', 'clientId', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="Secret"
              value={configs.paypal.secret || ''}
              onChange={(e) => updateConfig('paypal', 'secret', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <select
              value={configs.paypal.mode || 'sandbox'}
              onChange={(e) => updateConfig('paypal', 'mode', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="sandbox">Sandbox</option>
              <option value="live">Live</option>
            </select>
          </div>
        </div>

        {/* Google Calendar */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">📅 Google Calendar</h4>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="API Key"
              value={configs.googleCalendar.apiKey || ''}
              onChange={(e) => updateConfig('googleCalendar', 'apiKey', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Calendar ID"
              value={configs.googleCalendar.calendarId || ''}
              onChange={(e) => updateConfig('googleCalendar', 'calendarId', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        {/* Microsoft Calendar */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">📆 Microsoft Calendar</h4>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Client ID"
              value={configs.microsoftCalendar.clientId || ''}
              onChange={(e) => updateConfig('microsoftCalendar', 'clientId', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="Secret"
              value={configs.microsoftCalendar.secret || ''}
              onChange={(e) => updateConfig('microsoftCalendar', 'secret', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Tenant ID"
              value={configs.microsoftCalendar.tenantId || ''}
              onChange={(e) => updateConfig('microsoftCalendar', 'tenantId', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        {/* YouTube */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">🎥 YouTube Data API</h4>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="API Key"
              value={configs.youtube.apiKey || ''}
              onChange={(e) => updateConfig('youtube', 'apiKey', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Channel ID"
              value={configs.youtube.channelId || ''}
              onChange={(e) => updateConfig('youtube', 'channelId', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        {/* Google Places */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">📍 Google Places API</h4>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="API Key"
              value={configs.googlePlaces.apiKey || ''}
              onChange={(e) => updateConfig('googlePlaces', 'apiKey', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !hasConfigs}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          {saving ? 'Saving...' : 'Save All Integrations'}
        </button>
      </div>

      <div className="text-sm text-gray-600">
          {hasConfigs ? `${countConfigurations} integration(s) configured` : 'No integrations configured yet'}
      </div>
    </div>
  );
}
