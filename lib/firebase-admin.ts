import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, initializeFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;
let adminAuth: Auth | undefined;

/** Prefer FIREBASE_ADMIN_* (local), fall back to FIREBASE_* (Vercel). */
function getAdminProjectId(): string | undefined {
  return process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
}

function getAdminClientEmail(): string | undefined {
  return process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
}

/**
 * Vercel/env UIs often store private keys with literal \n, wrapped quotes, or real newlines.
 */
function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  // Strip wrapping quotes from dashboard paste
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  // Convert escaped newlines (and double-escaped) to real PEM line breaks
  key = key.replace(/\\n/g, '\n');
  // Some stores use literal "\n" twice
  if (!key.includes('-----BEGIN') && key.includes('BEGIN')) {
    // corrupted — leave as-is for clearer cert() error
  }
  return key;
}

function getPrivateKey(): string {
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) {
    throw new Error(
      'Firebase Admin private key is not configured. Set FIREBASE_ADMIN_PRIVATE_KEY or FIREBASE_PRIVATE_KEY.'
    );
  }
  const key = normalizePrivateKey(raw);
  if (!key.includes('BEGIN PRIVATE KEY') && !key.includes('BEGIN RSA PRIVATE KEY')) {
    throw new Error(
      'Firebase Admin private key looks invalid (missing BEGIN PRIVATE KEY). Re-paste the full PEM in Vercel env vars.'
    );
  }
  return key;
}

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const projectId = getAdminProjectId();
  const clientEmail = getAdminClientEmail();
  if (!projectId || !clientEmail) {
    throw new Error(
      'Firebase Admin credentials are incomplete. Set FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL (or FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL).'
    );
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: getPrivateKey(),
      }),
      storageBucket:
        process.env.FIREBASE_STORAGE_BUCKET ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        `${projectId}.firebasestorage.app`,
    });
  } catch (err) {
    console.error('[firebase-admin] initializeApp failed:', err);
    throw err;
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    const app = getAdminApp();
    try {
      adminDb = initializeFirestore(app, { ignoreUndefinedProperties: true } as Parameters<typeof initializeFirestore>[1]);
    } catch {
      adminDb = getFirestore(app);
    }
  }
  return adminDb;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) adminAuth = getAuth(getAdminApp());
  return adminAuth;
}
