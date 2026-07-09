'use client';

import { useCallback, useEffect, useState } from 'react';
import { Settings } from '@/lib/types';
import { getDefaultSettings } from '@/lib/db-service';
import { useAuth } from '@/context/AuthContext';
import { canAccessAdmin } from '@/lib/auth-utils';

interface UseSettingsResult {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

async function fetchPublicSettings(): Promise<Settings> {
  const res = await fetch('/api/public/settings');
  if (!res.ok) return getDefaultSettings();
  return res.json();
}

async function fetchAdminSettings(token: string): Promise<Settings> {
  const res = await fetch('/api/admin/settings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load admin settings');
  }
  return res.json();
}

export function useSettings(): UseSettingsResult {
  const { userData, currentUser } = useAuth();
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
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const isAdmin = canAccessAdmin(userData);

        if (isAdmin) {
          if (!currentUser) return;
          const token = await currentUser.getIdToken();
          const adminSettings = await fetchAdminSettings(token);
          if (!cancelled) {
            setSettings(adminSettings);
            setLoading(false);
          }
          return;
        }

        const publicSettings = await fetchPublicSettings();
        if (!cancelled) {
          setSettings(publicSettings);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[useSettings]', err);
          setError(err instanceof Error ? err.message : 'Failed to load settings');
          setSettings(getDefaultSettings());
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userData, currentUser, retryCount]);

  return { settings, loading, error, retry };
}
