import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: any = null;

export async function getAdminApp() {
  try {
    const apps = getApps();
    if (apps.length > 0) {
      return apps[0];
    }

    // Check for Firebase Admin credentials in environment
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('[Firebase Admin] Credentials missing:', {
        projectId: !!projectId,
        clientEmail: !!clientEmail,
        privateKey: !!privateKey,
      });
      return null;
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });

    console.log('[Firebase Admin] Initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function getDb(): Promise<any | null> {
  try {
    const app = await getAdminApp();
    if (!app) {
      return null;
    }
    return getFirestore(app);
  } catch (error) {
    console.error('[Firebase Admin] getDb error:', error);
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

export async function verifyToken(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const app = await getAdminApp();
    if (!app) {
      return null;
    }

    const auth = getAuth(app);
    const cleanToken = token.replace('Bearer ', '');
    const decodedToken = await auth.verifyIdToken(cleanToken);
    
    // Return decoded token for any authenticated user
    return decodedToken;
  } catch (error) {
    console.error('[Firebase Admin] Token verification failed:', error);
    return null;
  }
}

