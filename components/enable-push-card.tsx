'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getFirebaseServices } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/useSettings';

type PushStatus = 'loading' | 'unavailable' | 'disabled' | 'denied' | 'default' | 'granted';

/**
 * Explicit opt-in for browser push (required — browsers block silent permission prompts).
 */
export function EnablePushCard({ className = '' }: { className?: string }) {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const [status, setStatus] = useState<PushStatus>('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const fcm = settings?.integrations?.fcm;
  const fcmReady = !!(fcm?.enabled && fcm?.vapidKey && fcm.configured);

  const refreshStatus = useCallback(async () => {
    if (!currentUser) {
      setStatus('unavailable');
      return;
    }
    if (!fcmReady) {
      setStatus('disabled');
      return;
    }
    try {
      const supported = await isSupported();
      if (!supported || typeof Notification === 'undefined') {
        setStatus('unavailable');
        return;
      }
      const perm = Notification.permission;
      if (perm === 'granted') setStatus('granted');
      else if (perm === 'denied') setStatus('denied');
      else setStatus('default');
    } catch {
      setStatus('unavailable');
    }
  }, [currentUser, fcmReady]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const enable = async () => {
    if (!currentUser || !fcm?.vapidKey) return;
    setBusy(true);
    setMessage('');
    try {
      const supported = await isSupported();
      if (!supported) throw new Error('Push notifications are not supported in this browser.');

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'default');
        setMessage(
          permission === 'denied'
            ? 'Permission blocked. Allow notifications for this site in your browser settings, then try again.'
            : 'Permission was not granted.'
        );
        return;
      }

      const { app } = getFirebaseServices();
      if (!app) throw new Error('Firebase is not ready. Refresh and try again.');

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: fcm.vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!token) throw new Error('Could not get a push token. Check VAPID key and Firebase config.');

      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/members/fcm-token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, action: 'add' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save push token');

      setStatus('granted');
      setMessage('Push notifications enabled on this device.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to enable push');
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className={`p-6 bg-card rounded-xl border border-border ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
          {status === 'granted' ? <BellRing className="w-5 h-5" /> : status === 'denied' ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold mb-1">Push notifications</h3>
          {status === 'disabled' && (
            <p className="text-sm text-muted-foreground mb-3">
              Push is not turned on for the platform yet. An admin must enable FCM under Settings → Integrations
              (VAPID key + “Enable push notifications”).
            </p>
          )}
          {status === 'unavailable' && (
            <p className="text-sm text-muted-foreground mb-3">
              This browser does not support web push, or you need to be signed in.
            </p>
          )}
          {status === 'denied' && (
            <p className="text-sm text-muted-foreground mb-3">
              Notifications are blocked for this site. Open browser site settings, allow notifications, then click
              enable again.
            </p>
          )}
          {status === 'default' && (
            <p className="text-sm text-muted-foreground mb-3">
              Get alerts for events, invites, and membership updates on this device.
            </p>
          )}
          {status === 'granted' && (
            <p className="text-sm text-muted-foreground mb-3">
              Enabled on this device. You&apos;ll receive activity alerts while FCM is configured.
            </p>
          )}
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground mb-3">Checking notification status…</p>
          )}

          {(status === 'default' || status === 'denied' || status === 'granted') && fcmReady && (
            <button
              type="button"
              onClick={enable}
              disabled={busy || status === 'granted'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              {status === 'granted' ? 'Enabled' : 'Enable push notifications'}
            </button>
          )}
          {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
        </div>
      </div>
    </div>
  );
}
