'use client';

import { useLayoutEffect } from 'react';
import { Settings } from '@/lib/types';
import { applyFirebaseClientConfig } from '@/lib/firebase';

/** Initialize Firebase client SDK from server-loaded settings before AuthProvider mounts. */
export function FirebaseBootstrap({ initialSettings }: { initialSettings: Settings }) {
  useLayoutEffect(() => {
    applyFirebaseClientConfig(initialSettings.integrations?.firebaseClient);
  }, [initialSettings]);

  return null;
}
