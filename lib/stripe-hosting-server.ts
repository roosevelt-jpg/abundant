import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';

let hostingStripe: Stripe | null = null;
let hostingStripeKeyUsed: string | null = null;

/** Separate Stripe account for Hosting Plan purchases (not membership Stripe). */
export async function getHostingStripe(): Promise<Stripe> {
  let secretKey = process.env.STRIPE_HOSTING_SECRET_KEY;

  if (!secretKey) {
    const settingsSnap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
    secretKey = settingsSnap.data()?.integrations?.stripeHosting?.secretKey;
  }

  if (!secretKey) {
    throw new Error('Hosting Plan (Stripe) is not configured. Add keys in Settings → Integrations.');
  }

  if (hostingStripe && hostingStripeKeyUsed === secretKey) {
    return hostingStripe;
  }

  hostingStripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as never });
  hostingStripeKeyUsed = secretKey;
  return hostingStripe;
}

export async function getHostingStripePublishableKey(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_STRIPE_HOSTING_PUBLISHABLE_KEY) {
    return process.env.NEXT_PUBLIC_STRIPE_HOSTING_PUBLISHABLE_KEY;
  }
  const settingsSnap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
  return settingsSnap.data()?.integrations?.stripeHosting?.publishableKey || null;
}

export async function isHostingStripeConfigured(): Promise<boolean> {
  try {
    const pk = await getHostingStripePublishableKey();
    let secretKey = process.env.STRIPE_HOSTING_SECRET_KEY;
    if (!secretKey) {
      const settingsSnap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
      secretKey = settingsSnap.data()?.integrations?.stripeHosting?.secretKey;
    }
    return Boolean(pk && secretKey);
  } catch {
    return false;
  }
}
