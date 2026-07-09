import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

function initializeFirebase() {
  if (typeof window === 'undefined') return;
  if (app) return;

  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
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

if (typeof window !== 'undefined') {
  initializeFirebase();
}

export function getFirebaseServices() {
  if (typeof window !== 'undefined' && !app) {
    initializeFirebase();
  }
  return { app, auth, db, storage };
}

export function getDb(): Firestore {
  if (!db) initializeFirebase();
  if (!db) throw new Error('Firestore is not available');
  return db;
}

export { auth, db, storage };
export default app;
