'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { ImageUpload } from '@/components/image-upload';
import { useSettings } from '@/hooks/useSettings';
import { LoadState } from '@/components/load-state';
import { Settings, HeroSlide, HeroSliderConfig, HomePageContent, HomeFeatureCard, PartnerLogo } from '@/lib/types';
import { DEFAULT_HERO_SLIDER_CONFIG, HERO_TRANSITION_OPTIONS } from '@/lib/hero-slider-utils';
import { resolveHomePage } from '@/lib/home-page';
import { HOME_FEATURE_ICONS } from '@/lib/home-icons';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSearchParams, useRouter } from 'next/navigation';
import { toAdminSettingsResponse, integrationBlockConfiguredWithHints, type AdminSettingsResponse, type IntegrationSecretHints, type IntegrationSecretPreviews } from '@/lib/settings-merge';
import { formatStoredSecrets } from '@/lib/integration-secret-labels';
import { StoredSecretField } from '@/components/stored-secret-field';

type Tab = 'general' | 'branding' | 'integrations' | 'hero' | 'homepage' | 'social';

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'branding', label: 'Branding' },
  { id: 'social', label: 'Contact & Social' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'hero', label: 'Hero Slider' },
  { id: 'homepage', label: 'Homepage' },
];

export default function AdminSettingsEditor() {
  const { settings: liveSettings, loading, error, retry } = useSettings();
  const { authFetch } = useApiAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [secretHints, setSecretHints] = useState<IntegrationSecretHints>({});
  const [secretPreviews, setSecretPreviews] = useState<IntegrationSecretPreviews>({});

  const storedSecretLines = formatStoredSecrets(secretHints);

  const applyAdminResponse = (data: AdminSettingsResponse) => {
    const { _secretHints, _secretPreviews, ...settingsData } = data;
    setSecretHints(_secretHints ?? {});
    setSecretPreviews(_secretPreviews ?? {});
    setSettings(settingsData);
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab | null;
    if (tab && ['general', 'branding', 'social', 'integrations', 'hero', 'homepage'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab !== 'homepage') return;
    if (typeof window === 'undefined' || window.location.hash !== '#partners') return;
    const el = document.getElementById('partners');
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    if (liveSettings && !dirty) {
      applyAdminResponse(liveSettings as AdminSettingsResponse);
    }
  }, [liveSettings, dirty]);

  const buildSavePayload = (): Partial<Settings> => {
    if (!settings) return {};
    switch (activeTab) {
      case 'integrations':
        return { integrations: settings.integrations };
      case 'general':
        return {
          siteName: settings.siteName,
          description: settings.description,
          contactEmail: settings.contactEmail,
          phone: settings.phone,
          address: settings.address,
        };
      case 'branding':
        return { branding: settings.branding };
      case 'social':
        return { socialLinks: settings.socialLinks };
      case 'hero':
        return { heroSliderConfig: settings.heroSliderConfig, heroSlider: settings.heroSliderConfig?.slides };
      case 'homepage':
        return { homePage: settings.homePage };
      default:
        return settings;
    }
  };

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(`/admin/settings?tab=${tab}`, { scroll: false });
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setSuccessMessage('');
      const res = await authFetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(buildSavePayload()),
      });
      const data = (await res.json()) as AdminSettingsResponse;
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to save settings');
      }
      applyAdminResponse(data);
      setDirty(false);
      retry();
      const savedSecrets = formatStoredSecrets(data._secretHints ?? {});
      setSuccessMessage(
        activeTab === 'integrations'
          ? savedSecrets.length > 0
            ? `Integrations saved. ${savedSecrets.length} secret credential(s) stored securely: ${savedSecrets.join(', ')}.`
            : 'Integrations saved. Enter secret keys and save again if any integration still shows "Not configured".'
          : 'Settings saved successfully!'
      );
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setSuccessMessage(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const update = (partial: Partial<Settings>) => {
    setDirty(true);
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const updateIntegrations = (key: string, value: Record<string, unknown>) => {
    setDirty(true);
    const { configured: _omit, ...fields } = value;
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            integrations: {
              ...prev.integrations,
              [key]: { ...prev.integrations[key as keyof typeof prev.integrations], ...fields },
            },
          }
        : prev
    );
  };

  const integrationConfigured = (key: string, block: Record<string, unknown> | undefined) =>
    integrationBlockConfiguredWithHints(key, block ?? {}, secretHints[key]);

  const sliderConfig: HeroSliderConfig = settings?.heroSliderConfig ?? {
    ...DEFAULT_HERO_SLIDER_CONFIG,
    slides: settings?.heroSlider ?? [],
  };

  const updateSliderConfig = (partial: Partial<HeroSliderConfig>) => {
    const next = { ...sliderConfig, ...partial };
    update({ heroSliderConfig: next, heroSlider: next.slides });
  };

  const addSlide = () => {
    const slide: HeroSlide = {
      id: `slide-${Date.now()}`,
      image: '',
      badge: 'Welcome to Abundant',
      title: 'New Slide Title',
      description: 'Craft the text that appears on the left when this slide is active.',
      cta: { text: 'Join Now', link: '/apply' },
      secondaryCta: { text: 'Learn More', link: '/about' },
      order: sliderConfig.slides.length,
    };
    updateSliderConfig({ slides: [...sliderConfig.slides, slide] });
  };

  const updateSlide = (id: string, partial: Partial<HeroSlide>) => {
    updateSliderConfig({
      slides: sliderConfig.slides.map((s) => (s.id === id ? { ...s, ...partial } : s)),
    });
  };

  const removeSlide = (id: string) => {
    updateSliderConfig({ slides: sliderConfig.slides.filter((s) => s.id !== id) });
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const slides = [...sliderConfig.slides];
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    [slides[index], slides[target]] = [slides[target], slides[index]];
    updateSliderConfig({ slides: slides.map((s, i) => ({ ...s, order: i })) });
  };

  const homePage = resolveHomePage(settings?.homePage);

  const updateHomePage = (partial: Partial<HomePageContent>) => {
    update({ homePage: { ...homePage, ...partial, updatedAt: Date.now() } });
  };

  const updateFeatureCard = (index: number, partial: Partial<HomeFeatureCard>) => {
    const cards = [...homePage.featuresSection.cards];
    cards[index] = { ...cards[index], ...partial };
    updateHomePage({ featuresSection: { ...homePage.featuresSection, cards } });
  };

  const partnersSection = homePage.partnersSection;

  const updatePartnersSection = (partial: Partial<typeof partnersSection>) => {
    updateHomePage({ partnersSection: { ...partnersSection, ...partial } });
  };

  const updatePartner = (index: number, partial: Partial<PartnerLogo>) => {
    const partners = [...partnersSection.partners];
    partners[index] = { ...partners[index], ...partial };
    updatePartnersSection({ partners });
  };

  const movePartner = (index: number, direction: -1 | 1) => {
    const partners = [...partnersSection.partners];
    const target = index + direction;
    if (target < 0 || target >= partners.length) return;
    [partners[index], partners[target]] = [partners[target], partners[index]];
    updatePartnersSection({ partners: partners.map((p, i) => ({ ...p, order: i })) });
  };

  return (
    <LoadState loading={loading} error={error} onRetry={retry} loadingMessage="Loading settings...">
      {settings && (
        <div>
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Configure platform settings — changes reflect on the live site immediately</p>
          </div>

          {successMessage && (
            <div
              className={`mb-6 p-4 border rounded-lg text-sm ${
                successMessage.includes('saved') || successMessage.includes('successfully')
                  ? 'bg-green-500/10 border-green-500/20 text-green-600'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              }`}
            >
              {successMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-w-4xl space-y-6">
            {activeTab === 'general' && (
              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <h2 className="font-heading font-bold text-lg">General Settings</h2>
                <Field label="Site Name" value={settings.siteName} onChange={(v) => update({ siteName: v })} />
                <Field label="Description" value={settings.description} onChange={(v) => update({ description: v })} multiline />
                <Field label="Contact Email" value={settings.contactEmail} onChange={(v) => update({ contactEmail: v })} type="email" />
                <Field label="Phone" value={settings.phone || ''} onChange={(v) => update({ phone: v })} />
                <Field label="Address" value={settings.address || ''} onChange={(v) => update({ address: v })} multiline />
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <h2 className="font-heading font-bold text-lg">Branding</h2>
                <p className="text-sm text-muted-foreground">Logo, favicon, footer tagline, and copyright — used site-wide</p>
                <p className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg border border-border">
                  For a clean look on the navy header, upload a <strong>PNG with a transparent background</strong>. If your logo has a dark box around it, re-export without a background — the site also applies a blend fix, but transparent PNGs look best.
                </p>
                <ImageUpload
                  value={settings.branding?.logoUrl || ''}
                  onChange={(v) => update({ branding: { ...settings.branding, logoUrl: v } })}
                  folder="branding"
                  label="Site Logo (light backgrounds)"
                  maxWidth={800}
                  maxHeight={300}
                  quality={0.9}
                />
                <ImageUpload
                  value={settings.branding?.logoUrlDark || ''}
                  onChange={(v) => update({ branding: { ...settings.branding, logoUrlDark: v } })}
                  folder="branding"
                  label="Site Logo (dark backgrounds, optional)"
                  maxWidth={800}
                  maxHeight={300}
                  quality={0.9}
                />
                <ImageUpload
                  value={settings.branding?.faviconUrl || ''}
                  onChange={(v) => update({ branding: { ...settings.branding, faviconUrl: v } })}
                  folder="branding"
                  label="Favicon (browser tab icon)"
                  maxWidth={256}
                  maxHeight={256}
                  quality={0.95}
                />
                <p className="text-xs text-muted-foreground -mt-2">
                  Square PNG or WebP works best (32×32 to 256×256). Save settings after uploading for it to appear in browser tabs.
                </p>
                <Field
                  label="Founder name (email signature)"
                  value={settings.branding?.founderName || ''}
                  onChange={(v) => update({ branding: { ...settings.branding, founderName: v } })}
                />
                <Field
                  label="Founder welcome message"
                  value={settings.branding?.founderWelcomeMessage || ''}
                  onChange={(v) => update({ branding: { ...settings.branding, founderWelcomeMessage: v } })}
                  multiline
                />
                <p className="text-xs text-muted-foreground">
                  Sent after a new member verifies their email. Signed with the Founder name above. Includes a link to membership packages.
                </p>
                <Field
                  label="Footer Tagline"
                  value={settings.branding?.footerTagline || ''}
                  onChange={(v) => update({ branding: { ...settings.branding, footerTagline: v } })}
                  multiline
                />
                <Field
                  label="Copyright Line"
                  value={settings.branding?.copyrightText || ''}
                  onChange={(v) => update({ branding: { ...settings.branding, copyrightText: v } })}
                />
                <p className="text-xs text-muted-foreground">
                  Site credit is fixed: Made with ❤️ by FLYN.AI
                </p>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <h2 className="font-heading font-bold text-lg">Social Links</h2>
                <p className="text-sm text-muted-foreground">Used in footer, contact page, and WhatsApp button</p>
                {(['twitter', 'linkedin', 'instagram', 'facebook', 'whatsapp', 'youtube', 'tiktok', 'telegram'] as const).map((key) => (
                  <Field
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={settings.socialLinks?.[key] || ''}
                    onChange={(v) =>
                      update({ socialLinks: { ...settings.socialLinks, [key]: v } })
                    }
                  />
                ))}
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                {storedSecretLines.length > 0 && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-2">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      ✓ Your credentials are saved in Firestore
                    </p>
                    <ul className="text-sm text-green-800/90 dark:text-green-300/90 list-disc list-inside space-y-0.5">
                      {storedSecretLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground pt-1">
                      Saved secrets show a green <strong>Saved securely</strong> box with a masked preview (last 4 characters). Click <strong>Replace</strong> only when you need to change a credential.
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border border-border">
                  Enter each credential once and click Save. Secret fields show a green confirmation box after saving — your keys are stored, not lost.
                </p>
                <IntegrationBlock
                  title="Firebase Admin SDK"
                  configured={integrationConfigured('firebaseAdmin', settings.integrations.firebaseAdmin as Record<string, unknown>)}
                  secretHints={secretHints.firebaseAdmin}
                  secretPreviews={secretPreviews.firebaseAdmin}
                  fields={[
                    { label: 'Project ID', key: 'projectId' },
                    { label: 'Client Email', key: 'clientEmail' },
                    { label: 'Private Key (server only)', key: 'privateKey', type: 'password', multiline: true },
                  ]}
                  values={settings.integrations.firebaseAdmin || {}}
                  onChange={(key, val) => {
                    updateIntegrations('firebaseAdmin', { ...settings.integrations.firebaseAdmin, [key]: val });
                  }}
                />
                <p className="text-xs text-muted-foreground -mt-4 px-2">
                  Server-side credentials for Firestore, Auth, Storage, and FCM. Falls back to environment variables if empty.
                </p>
                <IntegrationBlock
                  title="Firebase Client SDK"
                  configured={integrationConfigured('firebaseClient', settings.integrations.firebaseClient as Record<string, unknown>)}
                  secretHints={secretHints.firebaseClient}
                  secretPreviews={secretPreviews.firebaseClient}
                  fields={[
                    { label: 'API Key', key: 'apiKey', type: 'password' },
                    { label: 'Auth Domain', key: 'authDomain' },
                    { label: 'Project ID', key: 'projectId' },
                    { label: 'Storage Bucket', key: 'storageBucket' },
                    { label: 'Messaging Sender ID', key: 'messagingSenderId' },
                    { label: 'App ID', key: 'appId' },
                  ]}
                  values={settings.integrations.firebaseClient || {}}
                  onChange={(key, val) => {
                    updateIntegrations('firebaseClient', { ...settings.integrations.firebaseClient, [key]: val });
                  }}
                />
                <p className="text-xs text-muted-foreground -mt-4 px-2">
                  Client-side Firebase config. Falls back to NEXT_PUBLIC_FIREBASE_* env vars if empty.
                </p>
                <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold">Gmail SMTP</h3>
                    <span className={`flex items-center gap-2 text-xs font-semibold ${settings.integrations.gmailSmtp?.configured ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <span className={`w-2 h-2 rounded-full ${integrationConfigured('gmailSmtp', settings.integrations.gmailSmtp as Record<string, unknown>) ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {integrationConfigured('gmailSmtp', settings.integrations.gmailSmtp as Record<string, unknown>) ? 'Live' : 'Not configured'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Used to email admin invite codes. Use a Gmail App Password if 2FA is enabled.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="SMTP Host" value={settings.integrations.gmailSmtp?.host || 'smtp.gmail.com'} onChange={(v) => updateIntegrations('gmailSmtp', { host: v })} />
                    <Field label="SMTP Port" value={String(settings.integrations.gmailSmtp?.port || 587)} onChange={(v) => updateIntegrations('gmailSmtp', { port: parseInt(v) || 587 })} />
                  </div>
                  <Field label="Gmail Address" value={settings.integrations.gmailSmtp?.user || ''} onChange={(v) => updateIntegrations('gmailSmtp', { user: v })} />
                  <SecretField
                    label="App Password"
                    value={settings.integrations.gmailSmtp?.password || ''}
                    stored={!!secretHints.gmailSmtp?.password}
                    preview={secretPreviews.gmailSmtp?.password}
                    onChange={(v) => updateIntegrations('gmailSmtp', { password: v })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="From Email" value={settings.integrations.gmailSmtp?.fromEmail || ''} onChange={(v) => updateIntegrations('gmailSmtp', { fromEmail: v })} />
                    <Field label="From Name" value={settings.integrations.gmailSmtp?.fromName || ''} onChange={(v) => updateIntegrations('gmailSmtp', { fromName: v })} />
                  </div>
                </div>
                <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold">FCM Push Notifications</h3>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={settings.integrations.fcm?.enabled || false}
                        onChange={(e) =>
                          updateIntegrations('fcm', {
                            ...settings.integrations.fcm,
                            enabled: e.target.checked,
                          })
                        }
                      />
                      Enable push notifications
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">Send push notifications to members. Requires Firebase Admin SDK and FCM enabled in Firebase Console.</p>
                  <Field
                    label="VAPID Key (Web Push)"
                    value={settings.integrations.fcm?.vapidKey || ''}
                    onChange={(v) =>
                      updateIntegrations('fcm', {
                        vapidKey: v,
                        enabled: settings.integrations.fcm?.enabled,
                      })
                    }
                  />
                  <Field
                    label="FCM Server Key (legacy, optional)"
                    value={settings.integrations.fcm?.serverKey || ''}
                    onChange={(v) => updateIntegrations('fcm', { serverKey: v })}
                    type="password"
                    stored={!!secretHints.fcm?.serverKey}
                    preview={secretPreviews.fcm?.serverKey}
                  />
                </div>
                <IntegrationBlock
                  title="Stripe"
                  configured={integrationConfigured('stripe', settings.integrations.stripe as Record<string, unknown>)}
                  secretHints={secretHints.stripe}
                  secretPreviews={secretPreviews.stripe}
                  fields={[
                    { label: 'Publishable Key', key: 'publishableKey', type: 'password' },
                    { label: 'Secret Key (server only)', key: 'secretKey', type: 'password' },
                    { label: 'Webhook Secret', key: 'webhookSecret', type: 'password' },
                  ]}
                  values={settings.integrations.stripe || {}}
                  onChange={(key, val) => {
                    updateIntegrations('stripe', { ...settings.integrations.stripe, [key]: val });
                  }}
                />
                <IntegrationBlock
                  title="YouTube"
                  configured={integrationConfigured('youtube', settings.integrations.youtube as Record<string, unknown>)}
                  secretHints={secretHints.youtube}
                  secretPreviews={secretPreviews.youtube}
                  fields={[
                    { label: 'API Key', key: 'apiKey', type: 'password' },
                    { label: 'Channel ID', key: 'channelId' },
                  ]}
                  values={settings.integrations.youtube || {}}
                  onChange={(key, val) => {
                    updateIntegrations('youtube', { ...settings.integrations.youtube, [key]: val });
                  }}
                />
                <IntegrationBlock
                  title="Google Maps / Places"
                  configured={integrationConfigured('googlePlaces', settings.integrations.googlePlaces as Record<string, unknown>)}
                  secretHints={secretHints.googlePlaces}
                  secretPreviews={secretPreviews.googlePlaces}
                  fields={[{ label: 'Maps API Key (client-side)', key: 'apiKey', type: 'password' }]}
                  values={settings.integrations.googlePlaces || {}}
                  onChange={(key, val) => {
                    updateIntegrations('googlePlaces', { ...settings.integrations.googlePlaces, [key]: val });
                  }}
                />
                <p className="text-xs text-muted-foreground -mt-4 px-2">
                  Enable Places API and Maps JavaScript API in Google Cloud Console. Used for event locations and member signup address autocomplete.
                </p>
                <IntegrationBlock
                  title="Chatbot AI"
                  configured={integrationConfigured('anthropic', settings.integrations.anthropic as Record<string, unknown>)}
                  secretHints={secretHints.anthropic}
                  secretPreviews={secretPreviews.anthropic}
                  fields={[{ label: 'API Key (server only)', key: 'apiKey', type: 'password' }]}
                  values={settings.integrations.anthropic || {}}
                  onChange={(key, val) => {
                    updateIntegrations('anthropic', { ...settings.integrations.anthropic, [key]: val });
                  }}
                />
                <p className="text-xs text-muted-foreground -mt-4 px-2">
                  Powers the site chatbot. Configure chatbot behavior under Admin → Chatbot.
                </p>
                <IntegrationBlock
                  title="SendGrid"
                  configured={integrationConfigured('sendgrid', settings.integrations.sendgrid as Record<string, unknown>)}
                  secretHints={secretHints.sendgrid}
                  secretPreviews={secretPreviews.sendgrid}
                  fields={[{ label: 'API Key', key: 'apiKey', type: 'password' }]}
                  values={settings.integrations.sendgrid || {}}
                  onChange={(key, val) => {
                    updateIntegrations('sendgrid', { ...settings.integrations.sendgrid, [key]: val });
                  }}
                />
                <div className="p-6 bg-card rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-bold">YouTube Section</h3>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={settings.youtubeSection?.enabled || false}
                        onChange={(e) =>
                          update({
                            youtubeSection: { ...settings.youtubeSection!, enabled: e.target.checked },
                          })
                        }
                      />
                      Enable on homepage
                    </label>
                  </div>
                  <Field
                    label="Section Title"
                    value={settings.youtubeSection?.title || ''}
                    onChange={(v) =>
                      update({ youtubeSection: { ...settings.youtubeSection!, title: v, enabled: settings.youtubeSection?.enabled ?? false } })
                    }
                  />
                  <Field
                    label="Section Description"
                    value={settings.youtubeSection?.description || ''}
                    onChange={(v) =>
                      update({ youtubeSection: { ...settings.youtubeSection!, description: v, enabled: settings.youtubeSection?.enabled ?? false } })
                    }
                    multiline
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Videos to Display</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={settings.youtubeSection?.videosPerPage ?? 3}
                      onChange={(e) =>
                        update({
                          youtubeSection: {
                            ...settings.youtubeSection!,
                            videosPerPage: Math.max(1, Math.min(12, parseInt(e.target.value) || 3)),
                            enabled: settings.youtubeSection?.enabled ?? false,
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hero' && (
              <div className="space-y-6">
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg text-sm text-muted-foreground">
                  Each slide pairs <strong>left-side content</strong> (badge, title, description, buttons) with a <strong>right-side image</strong>. When the slider advances, both update together.
                </div>

                <div className="p-6 bg-card rounded-xl border border-border space-y-5">
                  <h2 className="font-heading font-bold text-lg">Slider Behavior</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Autoplay interval (ms)</label>
                      <input
                        type="number"
                        min={2000}
                        max={30000}
                        step={500}
                        value={sliderConfig.speed}
                        onChange={(e) => updateSliderConfig({ speed: parseInt(e.target.value) || 5000 })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Transition duration (ms)</label>
                      <input
                        type="number"
                        min={0}
                        max={2000}
                        step={50}
                        value={sliderConfig.transitionDuration ?? 700}
                        onChange={(e) => updateSliderConfig({ transitionDuration: parseInt(e.target.value) || 700 })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Content alignment</label>
                      <select
                        value={sliderConfig.contentAlignment ?? 'left'}
                        onChange={(e) => updateSliderConfig({ contentAlignment: e.target.value as HeroSliderConfig['contentAlignment'] })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Transition effect</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {HERO_TRANSITION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateSliderConfig({ transition: opt.value })}
                          className={`text-left p-3 rounded-lg border transition-colors ${
                            sliderConfig.transition === opt.value
                              ? 'border-accent bg-accent/10'
                              : 'border-border hover:border-accent/40'
                          }`}
                        >
                          <span className="block text-sm font-semibold">{opt.label}</span>
                          <span className="block text-xs text-muted-foreground mt-0.5">{opt.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(
                      [
                        ['autoplay', 'Autoplay'],
                        ['loop', 'Loop slides'],
                        ['pauseOnHover', 'Pause on hover'],
                        ['showArrows', 'Show arrows'],
                        ['showDots', 'Show dots'],
                        ['kenBurns', 'Ken Burns zoom'],
                        ['mobileImageFirst', 'Image first on mobile'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm p-2 rounded-lg border border-border/60 bg-muted/20">
                        <input
                          type="checkbox"
                          checked={sliderConfig[key] ?? DEFAULT_HERO_SLIDER_CONFIG[key]}
                          onChange={(e) => updateSliderConfig({ [key]: e.target.checked })}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-bold text-lg">Slides</h2>
                  <button
                    onClick={addSlide}
                    className="flex items-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" /> Add Slide
                  </button>
                </div>

                {sliderConfig.slides.map((slide, index) => (
                  <div key={slide.id} className="p-6 bg-card rounded-xl border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Slide {index + 1}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => moveSlide(index, -1)} disabled={index === 0} className="px-2 py-1 text-xs border rounded disabled:opacity-30">↑</button>
                        <button onClick={() => moveSlide(index, 1)} disabled={index === sliderConfig.slides.length - 1} className="px-2 py-1 text-xs border rounded disabled:opacity-30">↓</button>
                        <button onClick={() => removeSlide(slide.id)} className="p-1 hover:bg-destructive/10 rounded">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Left — Text Content</p>
                        <Field label="Badge" value={slide.badge || ''} onChange={(v) => updateSlide(slide.id, { badge: v })} />
                        <Field label="Title" value={slide.title} onChange={(v) => updateSlide(slide.id, { title: v })} />
                        <Field label="Description" value={slide.description || slide.subtitle || ''} onChange={(v) => updateSlide(slide.id, { description: v })} multiline />
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Primary CTA Text" value={slide.cta?.text || ''} onChange={(v) => updateSlide(slide.id, { cta: { text: v, link: slide.cta?.link || '/' } })} />
                          <Field label="Primary CTA Link" value={slide.cta?.link || ''} onChange={(v) => updateSlide(slide.id, { cta: { text: slide.cta?.text || 'Join Now', link: v } })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Secondary CTA Text" value={slide.secondaryCta?.text || ''} onChange={(v) => updateSlide(slide.id, { secondaryCta: { text: v, link: slide.secondaryCta?.link || '/' } })} />
                          <Field label="Secondary CTA Link" value={slide.secondaryCta?.link || ''} onChange={(v) => updateSlide(slide.id, { secondaryCta: { text: slide.secondaryCta?.text || 'Learn More', link: v } })} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Right — Image</p>
                        <ImageUpload
                          value={slide.image}
                          onChange={(v) => updateSlide(slide.id, { image: v })}
                          folder="hero"
                          label="Slide Image"
                          maxWidth={1200}
                          maxHeight={1200}
                          quality={0.85}
                        />
                        {slide.image && (
                          <img src={slide.image} alt="Preview" className="w-full aspect-square object-cover rounded-lg border border-border" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {sliderConfig.slides.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No slides yet. Add one to show the hero slider on the homepage.</p>
                )}
              </div>
            )}

            {activeTab === 'homepage' && (
              <div className="space-y-6">
                <section id="partners" className="p-5 bg-card rounded-xl border border-accent/30 space-y-3 scroll-mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-heading font-bold text-lg">Partners Marquee</h2>
                    <label className="flex items-center gap-2 text-sm shrink-0">
                      <input
                        type="checkbox"
                        checked={partnersSection.enabled}
                        onChange={(e) => updatePartnersSection({ enabled: e.target.checked })}
                      />
                      Show on homepage
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Logo strip shown above the footer. Click <strong>Add Partner</strong>, upload each logo, then save settings.
                  </p>
                  <Field
                    label="Section Title"
                    value={partnersSection.title}
                    onChange={(v) => updatePartnersSection({ title: v })}
                  />
                  <div>
                    <label className="block text-xs font-medium mb-1">Scroll speed (seconds per loop)</label>
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={partnersSection.speed}
                      onChange={(e) => updatePartnersSection({ speed: parseInt(e.target.value, 10) || 40 })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        updatePartnersSection({
                          partners: [
                            ...partnersSection.partners,
                            {
                              id: `partner-${Date.now()}`,
                              name: '',
                              logoUrl: '',
                              url: '',
                              order: partnersSection.partners.length,
                            },
                          ],
                        })
                      }
                      className="text-sm text-accent flex items-center gap-1 font-semibold"
                    >
                      <Plus className="w-4 h-4" /> Add Partner
                    </button>
                  </div>
                  {partnersSection.partners.map((partner, i) => (
                    <div key={partner.id} className="p-4 bg-background rounded-lg border border-border space-y-3">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs text-muted-foreground">Partner {i + 1}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => movePartner(i, -1)}
                            disabled={i === 0}
                            className="px-2 py-1 text-xs border rounded disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => movePartner(i, 1)}
                            disabled={i === partnersSection.partners.length - 1}
                            className="px-2 py-1 text-xs border rounded disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updatePartnersSection({
                                partners: partnersSection.partners
                                  .filter((p) => p.id !== partner.id)
                                  .map((p, index) => ({ ...p, order: index })),
                              })
                            }
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                      <input
                        value={partner.name}
                        onChange={(e) => updatePartner(i, { name: e.target.value })}
                        placeholder="Partner name (used for alt text)"
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                      />
                      <input
                        value={partner.url ?? ''}
                        onChange={(e) => updatePartner(i, { url: e.target.value })}
                        placeholder="Website URL (optional)"
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                      />
                      <ImageUpload
                        value={partner.logoUrl}
                        onChange={(url) => updatePartner(i, { logoUrl: url })}
                        folder="partners"
                        label="Partner logo"
                        maxWidth={800}
                        maxHeight={400}
                      />
                    </div>
                  ))}
                  {partnersSection.partners.length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm border border-dashed border-border rounded-lg">
                      No partners yet — click <strong>Add Partner</strong> above to upload logos.
                    </p>
                  )}
                </section>

                <section className="p-5 bg-card rounded-xl border border-border space-y-3">
                  <h2 className="font-heading font-bold text-lg">Events Section</h2>
                  <Field label="Section Title" value={homePage.eventsSection.title} onChange={(v) => updateHomePage({ eventsSection: { ...homePage.eventsSection, title: v } })} />
                  <Field label="Subtitle" value={homePage.eventsSection.subtitle} onChange={(v) => updateHomePage({ eventsSection: { ...homePage.eventsSection, subtitle: v } })} />
                  <Field label="Link Text" value={homePage.eventsSection.linkText} onChange={(v) => updateHomePage({ eventsSection: { ...homePage.eventsSection, linkText: v } })} />
                  <Field label="Empty State Message" value={homePage.eventsSection.emptyMessage} onChange={(v) => updateHomePage({ eventsSection: { ...homePage.eventsSection, emptyMessage: v } })} />
                </section>

                <section className="p-5 bg-card rounded-xl border border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className="font-heading font-bold text-lg">Why Join / Feature Cards</h2>
                    <button
                      onClick={() =>
                        updateHomePage({
                          featuresSection: {
                            ...homePage.featuresSection,
                            cards: [
                              ...homePage.featuresSection.cards,
                              { id: `fc-${Date.now()}`, icon: 'star', title: '', description: '', order: homePage.featuresSection.cards.length },
                            ],
                          },
                        })
                      }
                      className="text-sm text-accent flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Card
                    </button>
                  </div>
                  <Field label="Section Title" value={homePage.featuresSection.title} onChange={(v) => updateHomePage({ featuresSection: { ...homePage.featuresSection, title: v } })} />
                  <Field label="Subtitle" value={homePage.featuresSection.subtitle} onChange={(v) => updateHomePage({ featuresSection: { ...homePage.featuresSection, subtitle: v } })} />
                  {homePage.featuresSection.cards.map((card, i) => (
                    <div key={card.id} className="p-4 bg-background rounded-lg border border-border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Card {i + 1}</span>
                        <button
                          onClick={() =>
                            updateHomePage({
                              featuresSection: {
                                ...homePage.featuresSection,
                                cards: homePage.featuresSection.cards.filter((c) => c.id !== card.id),
                              },
                            })
                          }
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Icon</label>
                        <select
                          value={card.icon}
                          onChange={(e) => updateFeatureCard(i, { icon: e.target.value as HomeFeatureCard['icon'] })}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                        >
                          {HOME_FEATURE_ICONS.map((ic) => (
                            <option key={ic.id} value={ic.id}>{ic.label}</option>
                          ))}
                        </select>
                      </div>
                      <input value={card.title ?? ''} onChange={(e) => updateFeatureCard(i, { title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm" />
                      <textarea value={card.description ?? ''} onChange={(e) => updateFeatureCard(i, { description: e.target.value })} placeholder="Description" rows={2} className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm" />
                    </div>
                  ))}
                </section>

                <section className="p-5 bg-card rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading font-bold text-lg">Call to Action Banner</h2>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={homePage.ctaSection.enabled}
                        onChange={(e) => updateHomePage({ ctaSection: { ...homePage.ctaSection, enabled: e.target.checked } })}
                      />
                      Show on homepage
                    </label>
                  </div>
                  <Field label="Title" value={homePage.ctaSection.title} onChange={(v) => updateHomePage({ ctaSection: { ...homePage.ctaSection, title: v } })} />
                  <Field label="Subtitle" value={homePage.ctaSection.subtitle} onChange={(v) => updateHomePage({ ctaSection: { ...homePage.ctaSection, subtitle: v } })} multiline />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Button Text" value={homePage.ctaSection.buttonText} onChange={(v) => updateHomePage({ ctaSection: { ...homePage.ctaSection, buttonText: v } })} />
                    <Field label="Button Link" value={homePage.ctaSection.buttonLink} onChange={(v) => updateHomePage({ ctaSection: { ...homePage.ctaSection, buttonLink: v } })} />
                  </div>
                </section>
              </div>
            )}

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
      )}
    </LoadState>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
  stored = false,
  preview,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  stored?: boolean;
  preview?: string;
}) {
  const safeValue = value ?? '';
  if (type === 'password') {
    return (
      <StoredSecretField
        label={label}
        value={safeValue}
        onChange={onChange}
        stored={stored}
        preview={preview}
        multiline={multiline}
      />
    );
  }

  const cls = 'w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent';

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {multiline ? (
        <textarea value={safeValue} onChange={(e) => onChange(e.target.value)} className={cls} rows={3} />
      ) : (
        <input type={type} value={safeValue} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}

function SecretField({
  label,
  value,
  onChange,
  stored = false,
  preview,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  stored?: boolean;
  preview?: string;
}) {
  return (
    <StoredSecretField
      label={label}
      value={value ?? ''}
      onChange={onChange}
      stored={stored}
      preview={preview}
    />
  );
}

function IntegrationBlock({
  title,
  configured,
  fields,
  values,
  onChange,
  secretHints,
  secretPreviews,
}: {
  title: string;
  configured?: boolean;
  fields: { label: string; key: string; type?: string; multiline?: boolean }[];
  values: Record<string, unknown>;
  onChange: (key: string, value: string) => void;
  secretHints?: Record<string, boolean>;
  secretPreviews?: Record<string, string>;
}) {
  const cls = 'w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent';
  return (
    <div className="p-6 bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold">{title}</h3>
        <span className={`flex items-center gap-2 text-xs font-semibold ${configured ? 'text-green-600' : 'text-muted-foreground'}`}>
          <span className={`w-2 h-2 rounded-full ${configured ? 'bg-green-500' : 'bg-gray-400'}`} />
          {configured ? 'Live' : 'Not configured'}
        </span>
      </div>
      <div className="space-y-3">
        {fields.map((f) => {
          const isSecret = f.type === 'password';
          const fieldValue = String(values[f.key] || '');
          const isStored = isSecret && !!secretHints?.[f.key] && !fieldValue.trim();

          if (isSecret) {
            return (
              <StoredSecretField
                key={f.key}
                label={f.label}
                value={fieldValue}
                onChange={(v) => onChange(f.key, v)}
                stored={isStored}
                preview={secretPreviews?.[f.key]}
                multiline={f.multiline}
              />
            );
          }

          return (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-2">{f.label}</label>
              {f.multiline ? (
                <textarea
                  value={fieldValue}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className={cls}
                  rows={4}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={fieldValue}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className={cls}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
