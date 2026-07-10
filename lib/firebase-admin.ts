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

function getPrivateKey(): string {
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      'Firebase Admin private key is not configured. Set FIREBASE_ADMIN_PRIVATE_KEY or FIREBASE_PRIVATE_KEY.'
    );
  }
  return key.replace(/\\n/g, '\n');
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
