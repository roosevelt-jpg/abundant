import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { getDefaultSettings } from '@/lib/db-service';
import { fillBlankSettingsFromDefaults, mergeSettingsUpdates } from '@/lib/settings-merge';
import { Settings } from '@/lib/types';

export async function getAdminSettings(): Promise<Settings> {
  const defaults = getDefaultSettings();
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
  if (!snap.exists) return defaults;
  return fillBlankSettingsFromDefaults(snap.data() as Settings, defaults);
}

export async function saveAdminSettings(updates: Partial<Settings>, updatedBy: string): Promise<Settings> {
  const ref = getAdminDb().collection('settings').doc(SETTINGS_DOC_ID);
  const existingSnap = await ref.get();
  const existing = existingSnap.exists
    ? fillBlankSettingsFromDefaults(existingSnap.data() as Settings, getDefaultSettings())
    : getDefaultSettings();

  const merged: Settings = {
    ...mergeSettingsUpdates(existing, updates),
    id: SETTINGS_DOC_ID,
    updatedAt: Date.now(),
    updatedBy,
  };

  await ref.set(merged);
  return merged;
}

export async function getPublicSettings(): Promise<Settings> {
  const { sanitizePublicSettings } = await import('@/lib/public-settings');
  return sanitizePublicSettings(await getAdminSettings());
}
