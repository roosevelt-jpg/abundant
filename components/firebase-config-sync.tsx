'use client';

import { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { applyFirebaseClientConfig } from '@/lib/firebase';

/** Apply Firebase client config from Firestore settings (falls back to env). */
export function FirebaseConfigSync() {
  const { settings } = useSettings();

  useEffect(() => {
    applyFirebaseClientConfig(settings.integrations?.firebaseClient);
  }, [settings.integrations?.firebaseClient]);

  return null;
}
