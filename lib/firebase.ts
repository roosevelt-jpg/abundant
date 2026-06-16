import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDummyKeyForBuild1234567890',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

function initializeFirebase() {
  if (app) return;
  
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    if (typeof window !== 'undefined') {
      console.warn('[Firebase] Client-side initialization:', error);
    }
  }
}

// Only initialize on client-side
if (typeof window !== 'undefined') {
  initializeFirebase();
}

export function getFirebaseServices() {
  if (typeof window !== 'undefined' && !app) {
    initializeFirebase();
  }
  return { app, auth, db, storage };
}

export { auth, db, storage };
export default app;
