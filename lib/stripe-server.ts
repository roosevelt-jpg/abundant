import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';

let stripe: Stripe | null = null;

export async function getStripe(): Promise<Stripe> {
  if (stripe) return stripe;

  let secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    const settingsSnap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
    secretKey = settingsSnap.data()?.integrations?.stripe?.secretKey;
  }

  if (!secretKey) throw new Error('Stripe not configured');

  stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as any });
  return stripe;
}

export async function getWebhookSecret(): Promise<string> {
  if (process.env.STRIPE_WEBHOOK_SECRET) return process.env.STRIPE_WEBHOOK_SECRET;

  const settingsSnap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
  const secret = settingsSnap.data()?.integrations?.stripe?.webhookSecret;
  if (!secret) throw new Error('Stripe webhook secret not configured');
  return secret;
}
