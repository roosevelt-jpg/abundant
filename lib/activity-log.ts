import { getAdminDb } from '@/lib/firebase-admin';
import { ActivityLog } from '@/lib/types';

export async function logActivityServer(
  entry: Omit<ActivityLog, 'id' | 'createdAt'>
): Promise<void> {
  try {
    const db = getAdminDb();
    const ref = db.collection('activityLogs').doc();
    await ref.set({
      ...entry,
      id: ref.id,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error('[activity-log]', error);
  }
}
