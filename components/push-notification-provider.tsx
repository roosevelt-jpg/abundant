'use client';

import { useEffect, useRef } from 'react';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { getFirebaseServices } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/useSettings';

/** Registers FCM token when the member is signed in and FCM is enabled */
export function PushNotificationProvider() {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const registered = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const fcm = settings?.integrations?.fcm;
    if (!fcm?.enabled || !fcm?.vapidKey || !fcm.configured) return;

    let cancelled = false;

    (async () => {
      try {
        const supported = await isSupported();
        if (!supported || cancelled) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted' || cancelled) return;

        const { app } = getFirebaseServices();
        if (!app) return;

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
          vapidKey: fcm.vapidKey,
          serviceWorkerRegistration: registration,
        });
        if (!token || cancelled || registered.current === token) return;

        const idToken = await currentUser.getIdToken();
        await fetch('/api/members/fcm-token', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, action: 'add' }),
        });
        registered.current = token;

        onMessage(messaging, (payload) => {
          const title = payload.notification?.title || 'Abundant Global Club';
          const body = payload.notification?.body || '';
          if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
          }
        });
      } catch (err) {
        console.warn('[FCM] registration skipped:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser, settings?.integrations?.fcm?.enabled, settings?.integrations?.fcm?.vapidKey, settings?.integrations?.fcm?.configured]);

  return null;
}
