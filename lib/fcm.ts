import { getAdminApp, getAdminDb } from '@/lib/firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { Settings } from '@/lib/types';

async function isFcmEnabled(): Promise<boolean> {
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
  const settings = snap.data() as Settings | undefined;
  return !!(settings?.integrations?.fcm?.enabled && settings?.integrations?.fcm?.configured);
}

export async function sendPushToToken(
  token: string,
  notification: { title: string; body: string; link?: string }
): Promise<string> {
  if (!(await isFcmEnabled())) {
    throw new Error('FCM is not enabled. Configure it in Settings → Integrations.');
  }

  const messaging = getMessaging(getAdminApp());
  return messaging.send({
    token,
    notification: { title: notification.title, body: notification.body },
    webpush: notification.link
      ? { fcmOptions: { link: notification.link } }
      : undefined,
  });
}

export async function sendPushToTopic(
  topic: string,
  notification: { title: string; body: string; link?: string }
): Promise<string> {
  if (!(await isFcmEnabled())) {
    throw new Error('FCM is not enabled. Configure it in Settings → Integrations.');
  }

  const messaging = getMessaging(getAdminApp());
  return messaging.send({
    topic,
    notification: { title: notification.title, body: notification.body },
    webpush: notification.link
      ? { fcmOptions: { link: notification.link } }
      : undefined,
  });
}

/** Broadcast to all members subscribed to the "members" topic */
export async function sendMemberBroadcast(notification: {
  title: string;
  body: string;
  link?: string;
}): Promise<string> {
  return sendPushToTopic('members', notification);
}
