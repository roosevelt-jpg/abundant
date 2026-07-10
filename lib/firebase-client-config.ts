import { Settings } from '@/lib/types';

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
};

export function resolveFirebaseClientConfig(
  fromSettings?: Settings['integrations']['firebaseClient']
): FirebaseClientConfig | null {
  const apiKey = fromSettings?.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = fromSettings?.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = fromSettings?.appId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain: fromSettings?.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: fromSettings?.storageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      fromSettings?.messagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId,
  };
}
