import { getDb } from './firebase-admin-server';
import type { Settings } from './types';

const DEFAULT_SETTINGS_ID = 'main';

export async function getSettings(): Promise<Settings | null> {
  try {
    const db = await getDb();
    const docSnap = await db.collection('settings').doc(DEFAULT_SETTINGS_ID).get();
    
    if (docSnap.exists) {
      return docSnap.data() as Settings;
    }
    return null;
  } catch (error) {
    console.error('[v0] Error getting settings from Admin SDK:', error);
    throw error;
  }
}

export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  try {
    const db = await getDb();
    const settingsRef = db.collection('settings').doc(DEFAULT_SETTINGS_ID);
    
    const existing = await settingsRef.get();
    
    if (existing.exists) {
      await settingsRef.update({
        ...updates,
        updatedAt: Date.now()
      });
    } else {
      await settingsRef.set({
        id: DEFAULT_SETTINGS_ID,
        ...updates,
        updatedAt: Date.now(),
        updatedBy: 'system'
      } as Settings);
    }
  } catch (error) {
    console.error('[v0] Error updating settings from Admin SDK:', error);
    throw error;
  }
}
