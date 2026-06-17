import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp: any = null;

export async function getAdminApp() {
  // Skip initialization if credentials are not available (e.g., during build)
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn('[Firebase Admin] Credentials not available, skipping initialization');
    return null;
  }

  try {
    const apps = getApps();
    if (apps.length > 0) {
      return apps[0];
    }

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });

    return adminApp;
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error);
    return null;
  }
}

export async function verifyAdminToken(token?: string | null) {
  if (!token) {
    return false;
  }

  try {
    const app = await getAdminApp();
    if (!app) {
      return false;
    }

    const auth = getAuth(app);
    const cleanToken = token.replace('Bearer ', '');
    const decodedToken = await auth.verifyIdToken(cleanToken);
    
    // Check if this is the admin email
    return decodedToken.email === 'admin@abundantglobalclub.com';
  } catch (error) {
    console.error('[Firebase Admin] Token verification failed:', error);
    return false;
  }
}
