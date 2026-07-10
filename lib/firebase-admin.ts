import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, initializeFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;
let adminAuth: Auth | undefined;

function getPrivateKey(): string {
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!key) throw new Error('FIREBASE_ADMIN_PRIVATE_KEY is not configured');
  return key.replace(/\\n/g, '\n');
}

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      (process.env.FIREBASE_ADMIN_PROJECT_ID
        ? `${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebasestorage.app`
        : undefined),
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
