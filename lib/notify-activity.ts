import { getAdminDb } from '@/lib/firebase-admin';
import { sendPushToToken, sendMemberBroadcast } from '@/lib/fcm';

export async function notifyUserPush(
  uid: string,
  notification: { title: string; body: string; link?: string }
): Promise<void> {
  try {
    const snap = await getAdminDb().collection('users').doc(uid).get();
    const tokens: string[] = snap.data()?.fcmTokens || [];
    await Promise.allSettled(tokens.map((t) => sendPushToToken(t, notification)));
  } catch (err) {
    console.error('[notifyUserPush]', err);
  }
}

export async function notifyMembersActivity(notification: {
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  try {
    await sendMemberBroadcast(notification);
  } catch (err) {
    // FCM may be disabled — soft-fail
    console.warn('[notifyMembersActivity]', err instanceof Error ? err.message : err);
  }
}
