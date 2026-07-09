'use client';

import { useCallback, useEffect, useState } from 'react';
import { Settings } from '@/lib/types';
import {
  getDefaultSettings,
  initializeSettings,
  subscribeToSettings,
} from '@/lib/db-service';
import { useAuth } from '@/context/AuthContext';
import { canAccessAdmin } from '@/lib/auth-utils';

interface UseSettingsResult {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
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

        // Admins can auto-create missing settings doc
        if (canAccessAdmin(userData)) {
          await initializeSettings(userData?.uid || 'admin');
        }

        let received = false;

        unsub = subscribeToSettings(
          (data) => {
            if (!cancelled) {
              received = true;
              setSettings(data);
              setLoading(false);
              setError(null);
            }
          },
          (err) => {
            if (!cancelled) {
              console.error('[useSettings] Firestore error:', err);
              setError('Failed to load settings');
              setLoading(false);
            }
          }
        );

        // Public visitors: fall back to defaults if doc missing
        setTimeout(() => {
          if (!cancelled && !received) {
            setSettings(getDefaultSettings());
            setLoading(false);
          }
        }, 1500);
      } catch (err) {
        if (!cancelled) {
          console.error('[useSettings] Setup error:', err);
          setError('Failed to load settings');
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
