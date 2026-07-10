'use client';

import { useLayoutEffect } from 'react';
import { Settings } from '@/lib/types';
import { applyFirebaseClientConfig } from '@/lib/firebase';

/** Initialize Firebase client SDK from settings (runs after AuthProvider is mounted). */
export function FirebaseBootstrap({ initialSettings }: { initialSettings: Settings }) {
  useLayoutEffect(() => {
    applyFirebaseClientConfig(initialSettings.integrations?.firebaseClient);
  }, [initialSettings]);

  return null;
}
