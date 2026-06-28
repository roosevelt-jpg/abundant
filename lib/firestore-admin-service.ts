import { getDb } from './firebase-admin-server';
import { getDefaultSettings } from './default-settings';
import type { Settings } from './types';

const DEFAULT_SETTINGS_ID = 'main';

export async function getSettings(): Promise<Settings | null> {
  try {
    console.log('[v0] Attempting to fetch settings from Firestore...');
    const db = await getDb();
    const docSnap = await db.collection('settings').doc(DEFAULT_SETTINGS_ID).get();
    
    if (docSnap.exists) {
      console.log('[v0] Settings found in Firestore');
      const data = docSnap.data();
      return data as Settings;
    }
    
    console.log('[v0] Settings document not found, returning defaults');
    return getDefaultSettings();
  } catch (error) {
    console.error('[v0] Error getting settings from Admin SDK:', error);
    // Return defaults on error instead of throwing
    console.warn('[v0] Returning default settings due to error');
    return getDefaultSettings();
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
