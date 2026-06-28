'use client';

import { useState, useEffect } from 'react';
import { Settings } from '@/lib/types';
import { Check, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface IntegrationTest {
  [key: string]: 'idle' | 'testing' | 'success' | 'error';
}

export function AdminIntegrationsEditor() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<Partial<Settings> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<IntegrationTest>({});
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[v0] Fetching integrations from API...');
      const startTime = Date.now();
      
      const response = await fetch('/api/settings', {
        cache: 'no-store',
        method: 'GET'
      });
      
      const duration = Date.now() - startTime;
      console.log(`[v0] Settings fetched in ${duration}ms, status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[v0] Settings data loaded successfully');
        setSettings(data);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error(`[v0] Settings API error ${response.status}:`, errorText);
        setError(`Failed to load integrations (${response.status})`);
      }
    } catch (err) {
      console.error('[v0] Error fetching settings:', err);
      setError(`Failed to load integrations: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateIntegration = async (integrationKey: string, config: any) => {
    try {
      setSaving(true);
      
      // Get auth token from current user
      const token = currentUser ? await currentUser.getIdToken() : null;
      if (!token) {
        setError('Not authenticated');
        return;
      }
      
      const integrations = settings?.integrations || {};
      const updatedIntegrations = {
        ...integrations,
        [integrationKey]: config
      };
      const updatedSettings: Partial<Settings> = {
        ...settings,
        integrations: updatedIntegrations
      };
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedSettings)
      });

      if (response.ok) {
        console.log('[v0] Integration saved successfully');
        setSettings(updatedSettings);
      } else {
        const errorData = await response.text();
        console.error('[v0] Save error:', errorData);
        setError('Failed to save integration');
      }
    } catch (err) {
      console.error('[v0] Error updating integration:', err);
      setError('Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  const testIntegration = async (integrationKey: string) => {
    setTestResults({ ...testResults, [integrationKey]: 'testing' });
    try {
      const integrations = settings?.integrations as any;
      const response = await fetch(`/api/integrations/test/${integrationKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integrations?.[integrationKey] || {})
      });

      if (response.ok) {
        setTestResults({ ...testResults, [integrationKey]: 'success' });
        setTimeout(() => {
          setTestResults({ ...testResults, [integrationKey]: 'idle' });
        }, 3000);
      } else {
        setTestResults({ ...testResults, [integrationKey]: 'error' });
        setTimeout(() => {
          setTestResults({ ...testResults, [integrationKey]: 'idle' });
        }, 3000);
      }
    } catch (err) {
      console.error('[v0] Test error:', err);
      setTestResults({ ...testResults, [integrationKey]: 'error' });
      setTimeout(() => {
        setTestResults({ ...testResults, [integrationKey]: 'idle' });
      }, 3000);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading integrations...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive rounded-lg">
        <p className="text-destructive font-medium mb-2">{error}</p>
        <p className="text-sm text-muted-foreground mb-3">
          Make sure Firebase Admin SDK is properly configured in environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL).
        </p>
        <button
          onClick={fetchSettings}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  const integrations = settings?.integrations || {};

  return (
    <div className="space-y-8">
      {/* Firebase Configuration */}
      <IntegrationCard
        title="Firebase"
        description="Configure Firebase Admin SDK and Client SDK for database, storage, and authentication"
        integrationKey="firebase"
        config={integrations.firebase}
        onUpdate={(config) => updateIntegration('firebase', config)}
        onTest={() => testIntegration('firebase')}
        testResult={testResults.firebase}
        fields={[
          { key: 'projectId', label: 'Project ID', type: 'text', placeholder: 'your-project-id' },
          { key: 'storageBucket', label: 'Storage Bucket', type: 'text', placeholder: 'your-project.appspot.com' },
          { key: 'adminSdkConfigured', label: 'Admin SDK Configured', type: 'checkbox' },
          { key: 'clientSdkConfigured', label: 'Client SDK Configured', type: 'checkbox' },
        ]}
      />

      {/* Gmail SMTP */}
      <IntegrationCard
        title="Gmail SMTP"
        description="Send transactional emails via Gmail for event confirmations, notifications, etc."
        integrationKey="gmailSmtp"
        config={integrations.gmailSmtp}
        onUpdate={(config) => updateIntegration('gmailSmtp', config)}
        onTest={() => testIntegration('gmailSmtp')}
        testResult={testResults.gmailSmtp}
        fields={[
          { key: 'email', label: 'Gmail Email Address', type: 'email', placeholder: 'your-email@gmail.com' },
          { key: 'senderName', label: 'Sender Name', type: 'text', placeholder: 'Abundant Global Club' },
          { key: 'appPassword', label: 'App Password', type: 'password', placeholder: 'Generated from Gmail', sensitive: true },
          { key: 'configured', label: 'Enabled', type: 'checkbox' },
        ]}
      />

      {/* Stripe Payments */}
      <IntegrationCard
        title="Stripe"
        description="Process payments for membership subscriptions and event registrations"
        integrationKey="stripe"
        config={integrations.stripe}
        onUpdate={(config) => updateIntegration('stripe', config)}
        onTest={() => testIntegration('stripe')}
        testResult={testResults.stripe}
        fields={[
          { key: 'publishableKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...' },
          { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...', sensitive: true },
          { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', sensitive: true },
          { key: 'configured', label: 'Enabled', type: 'checkbox' },
        ]}
      />

      {/* PayPal Payments */}
      <IntegrationCard
        title="PayPal"
        description="Alternative payment processor for memberships and event fees"
        integrationKey="paypal"
        config={integrations.paypal}
        onUpdate={(config) => updateIntegration('paypal', config)}
        onTest={() => testIntegration('paypal')}
        testResult={testResults.paypal}
        fields={[
          { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Your Client ID', sensitive: true },
          { key: 'secret', label: 'Secret', type: 'password', placeholder: 'Your Secret', sensitive: true },
          { 
            key: 'mode', 
            label: 'Mode', 
            type: 'select', 
            options: ['sandbox', 'live'],
            defaultValue: 'sandbox'
          },
          { key: 'configured', label: 'Enabled', type: 'checkbox' },
        ]}
      />

      {/* Google Calendar */}
      <IntegrationCard
        title="Google Calendar"
        description="Automatically sync events to Google Calendar when created"
        integrationKey="googleCalendar"
        config={integrations.googleCalendar}
        onUpdate={(config) => updateIntegration('googleCalendar', config)}
        onTest={() => testIntegration('googleCalendar')}
        testResult={testResults.googleCalendar}
        fields={[
          { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...', sensitive: true },
          { key: 'calendarId', label: 'Calendar ID', type: 'text', placeholder: 'calendar-id@group.calendar.google.com' },
          { key: 'configured', label: 'Enabled', type: 'checkbox' },
        ]}
      />

      {/* Microsoft Calendar */}
      <IntegrationCard
        title="Microsoft Calendar"
        description="Sync events with Microsoft Outlook calendar"
        integrationKey="microsoftCalendar"
        config={integrations.microsoftCalendar}
        onUpdate={(config) => updateIntegration('microsoftCalendar', config)}
        onTest={() => testIntegration('microsoftCalendar')}
        testResult={testResults.microsoftCalendar}
        fields={[
          { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Your Client ID', sensitive: true },
          { key: 'secret', label: 'Client Secret', type: 'password', placeholder: 'Your Secret', sensitive: true },
          { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'Your Tenant ID' },
          { key: 'configured', label: 'Enabled', type: 'checkbox' },
        ]}
      />

      {/* Apple Calendar */}
      <IntegrationCard
        title="Apple Calendar"
        description="Share calendar subscription for Apple Calendar, iOS Calendar"
        integrationKey="appleCalendar"
        config={integrations.appleCalendar}
        onUpdate={(config) => updateIntegration('appleCalendar', config)}
        onTest={() => testIntegration('appleCalendar')}
        testResult={testResults.appleCalendar}
        fields={[
          { key: 'calendarUrl', label: 'Calendar URL (.ics)', type: 'url', placeholder: 'https://...' },
          { key: 'configured', label: 'Enabled', type: 'checkbox' },
        ]}
      />

      {/* YouTube Data API */}
      <IntegrationCard
        title="YouTube Data API"
        description="Automatically fetch videos from your channel to display in Featured Videos section"
        integrationKey="youtubeDataApi"
        config={integrations.youtubeDataApi}
        onUpdate={(config) => updateIntegration('youtubeDataApi', config)}
        onTest={() => testIntegration('youtubeDataApi')}
        testResult={testResults.youtubeDataApi}
        fields={[
          { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...', sensitive: true },
          { key: 'channelId', label: 'YouTube Channel ID', type: 'text', placeholder: 'UCxxxxxx' },
          { key: 'autoFetchEnabled', label: 'Auto-fetch Videos', type: 'checkbox' },
          { key: 'fetchInterval', label: 'Fetch Interval (minutes)', type: 'number', defaultValue: 60 },
          { key: 'configured', label: 'Enabled', type: 'checkbox' },
        ]}
      />

      {/* Google Places API */}
      <IntegrationCard
        title="Google Places API"
        description="Autocomplete addresses for member signup and event creation with precise location coordinates"
        integrationKey="googlePlaces"
        config={integrations.googlePlaces}
        onUpdate={(config) => updateIntegration('googlePlaces', config)}
        onTest={() => testIntegration('googlePlaces')}
        testResult={testResults.googlePlaces}
        fields={[
          { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...', sensitive: true },
          { key: 'restrictCountries', label: 'Restrict to Countries (comma-separated)', type: 'text', placeholder: 'ae,sa,kw' },
          { key: 'configured', label: 'Enabled', type: 'checkbox' },
        ]}
      />
    </div>
  );
}

interface IntegrationCardProps {
  title: string;
  description: string;
  integrationKey: string;
  config: any;
  onUpdate: (config: any) => void;
  onTest: () => void;
  testResult?: string;
  fields: FieldConfig[];
}

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'checkbox' | 'number' | 'url' | 'select';
  placeholder?: string;
  options?: string[];
  defaultValue?: any;
  sensitive?: boolean;
}

function IntegrationCard({
  title,
  description,
  integrationKey,
  config,
  onUpdate,
  onTest,
  testResult,
  fields
}: IntegrationCardProps) {
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});

  const handleFieldChange = (key: string, value: any) => {
    const newConfig = { ...config };
    newConfig[key] = value;
    onUpdate(newConfig);
  };

  return (
    <div className="p-6 bg-card border border-border rounded-xl space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onTest}
            disabled={testResult === 'testing'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              testResult === 'testing' ? 'opacity-50 cursor-not-allowed' :
              testResult === 'success' ? 'bg-green-500/20 text-green-600' :
              testResult === 'error' ? 'bg-red-500/20 text-red-600' :
              'bg-accent/10 text-accent hover:bg-accent/20'
            }`}
          >
            {testResult === 'testing' && <RefreshCw className="w-4 h-4 animate-spin" />}
            {testResult === 'success' && <Check className="w-4 h-4" />}
            {testResult === 'error' && <X className="w-4 h-4" />}
            {!testResult || testResult === 'idle' ? 'Test Connection' : 
             testResult === 'success' ? 'Connected' :
             testResult === 'error' ? 'Connection Failed' : 'Testing...'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className={field.type === 'checkbox' ? 'md:col-span-2' : ''}>
            {field.type === 'checkbox' ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config?.[field.key] || false}
                  onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm font-medium">{field.label}</span>
              </label>
            ) : field.type === 'select' ? (
              <div>
                <label className="block text-xs font-medium mb-2">{field.label}</label>
                <select
                  value={config?.[field.key] || field.defaultValue || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium mb-2 flex items-center justify-between">
                  {field.label}
                  {field.sensitive && (
                    <button
                      onClick={() => setShowSecrets({ ...showSecrets, [field.key]: !showSecrets[field.key] })}
                      className="p-1 hover:bg-accent/10 rounded"
                    >
                      {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </label>
                <input
                  type={field.sensitive && !showSecrets[field.key] ? 'password' : field.type}
                  value={config?.[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
