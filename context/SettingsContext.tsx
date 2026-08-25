'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Settings } from '@/lib/types';
import { getDefaultSettings } from '@/lib/db-service';
import { AuthContext } from '@/context/AuthContext';
import { canAccessAdmin, isPrimaryAdmin } from '@/lib/auth-utils';

interface UseSettingsResult {
  settings: Settings;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const SettingsContext = createContext<UseSettingsResult | null>(null);

async function fetchPublicSettings(): Promise<Settings> {
  const res = await fetch('/api/public/settings', {
    cache: 'no-store',
  });
  if (!res.ok) return getDefaultSettings();
  return res.json();
}

async function fetchAdminSettings(token: string): Promise<Settings> {
  const res = await fetch('/api/admin/settings', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load admin settings');
  }
  return res.json();
}

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: Settings;
}) {
  const auth = useContext(AuthContext);
  const userData = auth?.userData ?? null;
  const currentUser = auth?.currentUser ?? null;
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const isAdmin = canAccessAdmin(userData) || isPrimaryAdmin(currentUser?.email);

        if (isAdmin) {
          if (!currentUser) {
            if (!cancelled) setLoading(false);
            return;
          }
          const token = await currentUser.getIdToken(true);
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
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userData, currentUser, retryCount]);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, retry }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): UseSettingsResult {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
