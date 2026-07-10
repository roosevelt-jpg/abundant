import { NextResponse } from 'next/server';
import { getPublicSettings } from '@/lib/settings-server';
import { resolveFirebaseClientConfig } from '@/lib/firebase-client-config';

export const dynamic = 'force-dynamic';

/** Serves firebase-messaging-sw.js with live Firebase client config */
export async function GET() {
  let config: Record<string, string> = {};
  try {
    const settings = await getPublicSettings();
    const resolved = resolveFirebaseClientConfig(settings.integrations?.firebaseClient);
    if (resolved) {
      config = {
        apiKey: resolved.apiKey || '',
        authDomain: resolved.authDomain || '',
        projectId: resolved.projectId || '',
        storageBucket: resolved.storageBucket || '',
        messagingSenderId: resolved.messagingSenderId || '',
        appId: resolved.appId || '',
      };
    }
  } catch (err) {
    console.error('[fcm-sw]', err);
  }

  const js = `
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');
try {
  firebase.initializeApp(${JSON.stringify(config)});
  firebase.messaging();
} catch (e) {
  console.warn('[fcm-sw] init failed', e);
}
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var link = (event.notification.data && event.notification.data.link) || '/';
  event.waitUntil(clients.openWindow(link));
});
`;

  return new NextResponse(js, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache',
    },
  });
}
