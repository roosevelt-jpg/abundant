import { Settings } from '@/lib/types';

/** Strip secrets before sending settings to the public client */
export function sanitizePublicSettings(settings: Settings): Settings {
  return {
    ...settings,
    integrations: {
      stripe: settings.integrations.stripe
        ? {
            publishableKey: settings.integrations.stripe.publishableKey,
            configured: settings.integrations.stripe.configured,
          }
        : undefined,
      sendgrid: settings.integrations.sendgrid
        ? { configured: settings.integrations.sendgrid.configured }
        : undefined,
      googlePlaces: settings.integrations.googlePlaces
        ? { configured: settings.integrations.googlePlaces.configured }
        : undefined,
      whatsapp: settings.integrations.whatsapp,
      youtube: settings.integrations.youtube
        ? {
            channelId: settings.integrations.youtube.channelId,
            configured: settings.integrations.youtube.configured,
          }
        : undefined,
      anthropic: settings.integrations.anthropic
        ? { configured: settings.integrations.anthropic.configured }
        : undefined,
    },
  };
}
