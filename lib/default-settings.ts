import type { Settings } from './types';

const DEFAULT_SETTINGS_ID = 'main';

export function getDefaultSettings(): Settings {
  return {
    id: DEFAULT_SETTINGS_ID,
    siteName: 'Abundant Global Club',
    description: 'A Global Network of Success',
    contactEmail: 'hello@abundant.club',
    phone: '+1 (234) 567-890',
    address: 'Dubai, UAE',
    socialLinks: {
      twitter: 'https://twitter.com/abundant',
      linkedin: 'https://linkedin.com/company/abundant',
      instagram: 'https://instagram.com/abundant'
    },
    colors: {
      primary: '#0F1B2E',
      secondary: '#B8973A',
      accent: '#D4AF87'
    },
    integrations: {
      firebase: { adminSdkConfigured: true, clientSdkConfigured: true, projectId: '', storageBucket: '' },
      gmailSmtp: { configured: false, email: '', senderName: 'Abundant Global Club' },
      stripe: { configured: false, publishableKey: '', webhookSecret: '' },
      paypal: { configured: false, mode: 'sandbox' },
      googleCalendar: { configured: false, calendarId: '' },
      microsoftCalendar: { configured: false, tenantId: '' },
      appleCalendar: { configured: false, calendarUrl: '' },
      youtubeDataApi: { configured: false, channelId: '', autoFetchEnabled: false, fetchInterval: 60 },
      googlePlaces: { configured: false, restrictCountries: ['ae', 'sa', 'kw', 'ae', 'om', 'qa', 'bh'] }
    },
    languages: ['en', 'ar'],
    defaultLanguage: 'en',
    theme: 'dark',
    heroSlider: {
      enabled: true,
      speed: 5000,
      transition: 'fade',
      autoPlay: true,
      slides: []
    },
    youtubeSection: {
      enabled: false,
      title: 'Featured Videos',
      description: 'Watch our latest content'
    },
    updatedAt: Date.now(),
    updatedBy: 'system'
  };
}
