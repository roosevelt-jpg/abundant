import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDummyKeyForBuild1234567890',
  authDomain: 'abundantglobalclub.firebaseapp.com',
  projectId: 'abundantglobalclub',
  storageBucket: 'abundantglobalclub.firebasestorage.app',
  messagingSenderId: '1007344596781',
  appId: '1:1007344596781:web:7c172ebfa441699b8f05a4',
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
    
    // Enable persistence for auth state
    setPersistence(auth, browserLocalPersistence).catch(error => {
      console.warn('[Firebase] Persistence setup failed:', error);
    });
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
