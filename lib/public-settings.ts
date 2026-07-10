import { Settings } from '@/lib/types';

/** Strip secrets before sending settings to the public client */
export function sanitizePublicSettings(settings: Settings): Settings {
  const { systemPrompt: _omit, ...publicChatbot } = settings.chatbot ?? {};

  return {
    ...settings,
    chatbot: settings.chatbot
      ? {
          ...publicChatbot,
          enabled: settings.chatbot.enabled,
        }
      : undefined,
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
      firebaseAdmin: settings.integrations.firebaseAdmin
        ? { configured: settings.integrations.firebaseAdmin.configured }
        : undefined,
      firebaseClient: settings.integrations.firebaseClient
        ? {
            apiKey: settings.integrations.firebaseClient.apiKey,
            authDomain: settings.integrations.firebaseClient.authDomain,
            projectId: settings.integrations.firebaseClient.projectId,
            storageBucket: settings.integrations.firebaseClient.storageBucket,
            messagingSenderId: settings.integrations.firebaseClient.messagingSenderId,
            appId: settings.integrations.firebaseClient.appId,
            configured: settings.integrations.firebaseClient.configured,
          }
        : undefined,
      gmailSmtp: settings.integrations.gmailSmtp
        ? { configured: settings.integrations.gmailSmtp.configured }
        : undefined,
      fcm: settings.integrations.fcm
        ? {
            vapidKey: settings.integrations.fcm.vapidKey,
            enabled: settings.integrations.fcm.enabled,
            configured: settings.integrations.fcm.configured,
          }
        : undefined,
    },
  };
}
