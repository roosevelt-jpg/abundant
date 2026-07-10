import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { Settings } from '@/lib/types';
import { resolveFirebaseClientConfig } from '@/lib/firebase-client-config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let activeConfigKey = '';

function configKey(config: ReturnType<typeof resolveFirebaseClientConfig>): string {
  if (!config) return '';
  return `${config.apiKey}|${config.projectId}|${config.appId}`;
}

function initializeFirebaseWithConfig(fromSettings?: Settings['integrations']['firebaseClient']) {
  if (typeof window === 'undefined') return;

  const config = resolveFirebaseClientConfig(fromSettings);
  if (!config) return;

  const nextKey = configKey(config);
  if (app && activeConfigKey === nextKey) return;
  if (app) return;

  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
    activeConfigKey = nextKey;
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.warn('[Firebase] Persistence setup failed:', error);
    });
  } catch (error) {
    console.warn('[Firebase] Client-side initialization failed:', error);
  }
}

/** Called from SettingsProvider sync — prefers Firestore config over env. */
export function applyFirebaseClientConfig(fromSettings?: Settings['integrations']['firebaseClient']) {
  initializeFirebaseWithConfig(fromSettings);
}

export function getFirebaseServices() {
  if (typeof window !== 'undefined' && !app) {
    initializeFirebaseWithConfig();
  }
  return { app, auth, db, storage };
}

export function getDb(): Firestore {
  if (!db) initializeFirebaseWithConfig();
  if (!db) throw new Error('Firestore is not available');
  return db;
}

export { auth, db, storage };
export default app;
