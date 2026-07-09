'use client';

import { useCallback, useEffect, useState } from 'react';
import { Settings } from '@/lib/types';
import { getDefaultSettings } from '@/lib/db-service';
import { useAuth } from '@/context/AuthContext';
import { canAccessAdmin } from '@/lib/auth-utils';
import { getDb } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { SETTINGS_DOC_ID } from '@/lib/constants';

interface UseSettingsResult {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

async function fetchSettingsFromApi(): Promise<Settings> {
  const res = await fetch('/api/public/settings');
  if (!res.ok) return getDefaultSettings();
  return res.json();
}

export function useSettings(): UseSettingsResult {
  const { userData } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    async function setup() {
      try {
        setLoading(true);
        setError(null);

        // Load via API first (bypasses client Firestore rules)
        const apiSettings = await fetchSettingsFromApi();
        if (!cancelled) {
          setSettings(apiSettings);
          setLoading(false);
        }

        // Admins: also subscribe to Firestore for live updates
        if (canAccessAdmin(userData)) {
          try {
            const { initializeSettings } = await import('@/lib/db-service');
            await initializeSettings(userData?.uid || 'admin');
            const db = getDb();
            unsub = onSnapshot(
              doc(db, 'settings', SETTINGS_DOC_ID),
              (snap) => {
                if (!cancelled && snap.exists()) {
                  setSettings(snap.data() as Settings);
                }
              },
              () => {
                // Silent — API data already loaded
              }
            );
          } catch {
            // Admin live sync optional
          }
        }
      } catch {
        if (!cancelled) {
          setSettings(getDefaultSettings());
          setLoading(false);
        }
      }
    }

    setup();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [userData, retryCount]);

  return { settings, loading, error, retry };
}
