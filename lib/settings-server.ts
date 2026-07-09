import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { getDefaultSettings } from '@/lib/db-service';
import { mergeSettingsIntegrations } from '@/lib/settings-merge';
import { Settings } from '@/lib/types';

export async function getAdminSettings(): Promise<Settings> {
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
  if (!snap.exists) return getDefaultSettings();
  return snap.data() as Settings;
}

export async function saveAdminSettings(updates: Partial<Settings>, updatedBy: string): Promise<Settings> {
  const ref = getAdminDb().collection('settings').doc(SETTINGS_DOC_ID);
  const existingSnap = await ref.get();
  const existing = existingSnap.exists ? (existingSnap.data() as Settings) : getDefaultSettings();

  const merged: Settings = {
    ...existing,
    ...updates,
    integrations: updates.integrations
      ? mergeSettingsIntegrations(existing.integrations, updates.integrations)
      : existing.integrations,
    id: SETTINGS_DOC_ID,
    updatedAt: Date.now(),
    updatedBy,
  };

  await ref.set(merged);
  return merged;
}
