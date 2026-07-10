import { IntegrationSecretHints } from '@/lib/settings-merge';

const INTEGRATION_LABELS: Record<string, string> = {
  firebaseAdmin: 'Firebase Admin',
  firebaseClient: 'Firebase Client',
  gmailSmtp: 'Gmail SMTP',
  stripe: 'Stripe',
  youtube: 'YouTube',
  googlePlaces: 'Google Maps',
  anthropic: 'Chatbot AI',
  sendgrid: 'SendGrid',
  fcm: 'FCM',
};

const FIELD_LABELS: Record<string, string> = {
  apiKey: 'API Key',
  secretKey: 'Secret Key',
  webhookSecret: 'Webhook Secret',
  privateKey: 'Private Key',
  password: 'Password',
  serverKey: 'Server Key',
  publishableKey: 'Publishable Key',
};

export function formatStoredSecrets(hints: IntegrationSecretHints): string[] {
  const lines: string[] = [];
  for (const [integration, fields] of Object.entries(hints)) {
    for (const [field, stored] of Object.entries(fields)) {
      if (!stored) continue;
      const name = INTEGRATION_LABELS[integration] ?? integration;
      const fieldLabel = FIELD_LABELS[field] ?? field;
      lines.push(`${name} — ${fieldLabel}`);
    }
  }
  return lines;
}
