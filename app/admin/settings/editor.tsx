'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { ImageUpload } from '@/components/image-upload';
import { useSettings } from '@/hooks/useSettings';
import { updateSettings } from '@/lib/db-service';
import { LoadState } from '@/components/load-state';
import { Settings, HeroSlide, HeroSliderConfig } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';

type Tab = 'general' | 'branding' | 'integrations' | 'hero' | 'social';

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'branding', label: 'Branding' },
  { id: 'social', label: 'Contact & Social' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'hero', label: 'Hero Slider' },
];

export default function AdminSettingsEditor() {
  const { settings: liveSettings, loading, error, retry } = useSettings();
  const { userData } = useAuth();
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab | null;
    if (tab && ['general', 'branding', 'social', 'integrations', 'hero'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (liveSettings) setSettings(liveSettings);
  }, [liveSettings]);

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await updateSettings(settings, userData?.uid || 'admin');
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setSuccessMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const update = (partial: Partial<Settings>) => {
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const updateIntegrations = (key: string, value: Record<string, unknown>) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            integrations: {
              ...prev.integrations,
              [key]: { ...prev.integrations[key as keyof typeof prev.integrations], ...value },
            },
          }
        : prev
    );
  };

  const sliderConfig: HeroSliderConfig = settings?.heroSliderConfig ?? {
    slides: settings?.heroSlider ?? [],
    speed: 5000,
    transition: 'fade',
    autoplay: true,
    loop: true,
    pauseOnHover: true,
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
      cta: { text: 'Join Now', link: '/signup' },
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
                successMessage.includes('Error')
                  ? 'bg-destructive/10 border-destructive/20 text-destructive'
                  : 'bg-green-500/10 border-green-500/20 text-green-600'
              }`}
            >
              {successMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
                <p className="text-sm text-muted-foreground">Logo, footer tagline, and copyright — used site-wide in header and footer</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Credit Name (e.g. FLYN.AI)"
                    value={settings.branding?.creditName || ''}
                    onChange={(v) => update({ branding: { ...settings.branding, creditName: v } })}
                  />
                  <Field
                    label="Credit Link URL"
                    value={settings.branding?.creditUrl || ''}
                    onChange={(v) => update({ branding: { ...settings.branding, creditUrl: v } })}
                  />
                </div>
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
                <IntegrationBlock
                  title="Stripe"
                  configured={settings.integrations.stripe?.configured}
                  fields={[
                    { label: 'Publishable Key', key: 'publishableKey', type: 'password' },
                    { label: 'Secret Key (server only)', key: 'secretKey', type: 'password' },
                    { label: 'Webhook Secret', key: 'webhookSecret', type: 'password' },
                  ]}
                  values={settings.integrations.stripe || {}}
                  onChange={(key, val) => {
                    updateIntegrations('stripe', { [key]: val, configured: !!val });
                  }}
                />
                <IntegrationBlock
                  title="YouTube"
                  configured={settings.integrations.youtube?.configured}
                  fields={[
                    { label: 'API Key', key: 'apiKey', type: 'password' },
                    { label: 'Channel ID', key: 'channelId' },
                  ]}
                  values={settings.integrations.youtube || {}}
                  onChange={(key, val) => {
                    updateIntegrations('youtube', { [key]: val, configured: !!(settings.integrations.youtube?.apiKey || key === 'apiKey' ? val : settings.integrations.youtube?.channelId) });
                  }}
                />
                <IntegrationBlock
                  title="Google Maps / Places"
                  configured={settings.integrations.googlePlaces?.configured}
                  fields={[{ label: 'Maps API Key (client-side)', key: 'apiKey', type: 'password' }]}
                  values={settings.integrations.googlePlaces || {}}
                  onChange={(key, val) => {
                    updateIntegrations('googlePlaces', { [key]: val, configured: !!val });
                  }}
                />
                <p className="text-xs text-muted-foreground -mt-4 px-2">
                  Enable Places API and Maps JavaScript API in Google Cloud Console. Used for event locations and member signup address autocomplete.
                </p>
                <IntegrationBlock
                  title="Anthropic API"
                  configured={settings.integrations.anthropic?.configured}
                  fields={[{ label: 'API Key (server only)', key: 'apiKey', type: 'password' }]}
                  values={settings.integrations.anthropic || {}}
                  onChange={(key, val) => {
                    updateIntegrations('anthropic', { [key]: val, configured: !!val });
                  }}
                />
                <IntegrationBlock
                  title="SendGrid"
                  configured={settings.integrations.sendgrid?.configured}
                  fields={[{ label: 'API Key', key: 'apiKey', type: 'password' }]}
                  values={settings.integrations.sendgrid || {}}
                  onChange={(key, val) => {
                    updateIntegrations('sendgrid', { [key]: val, configured: !!val });
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

                <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                  <h2 className="font-heading font-bold text-lg">Slider Behavior</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Speed (ms)</label>
                      <input
                        type="number"
                        value={sliderConfig.speed}
                        onChange={(e) => updateSliderConfig({ speed: parseInt(e.target.value) || 5000 })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Transition</label>
                      <select
                        value={sliderConfig.transition}
                        onChange={(e) => updateSliderConfig({ transition: e.target.value as HeroSliderConfig['transition'] })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                      >
                        <option value="fade">Fade</option>
                        <option value="slide">Slide</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {(['autoplay', 'loop', 'pauseOnHover'] as const).map((key) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={sliderConfig[key]}
                          onChange={(e) => updateSliderConfig({ [key]: e.target.checked })}
                        />
                        {key === 'pauseOnHover' ? 'Pause on Hover' : key.charAt(0).toUpperCase() + key.slice(1)}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  const cls = 'w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent';
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} className={cls} rows={3} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}

function IntegrationBlock({
  title,
  configured,
  fields,
  values,
  onChange,
}: {
  title: string;
  configured?: boolean;
  fields: { label: string; key: string; type?: string }[];
  values: Record<string, unknown>;
  onChange: (key: string, value: string) => void;
}) {
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
        {fields.map((f) => (
          <Field
            key={f.key}
            label={f.label}
            type={f.type}
            value={String(values[f.key] || '')}
            onChange={(v) => onChange(f.key, v)}
          />
        ))}
      </div>
    </div>
  );
}
