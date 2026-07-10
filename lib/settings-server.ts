import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { getDefaultSettings } from '@/lib/db-service';
import { fillBlankSettingsFromDefaults, mergeSettingsUpdates, normalizeStoredIntegrations, omitBlankIntegrationSecrets } from '@/lib/settings-merge';
import { Settings } from '@/lib/types';

export async function getAdminSettings(): Promise<Settings> {
  const defaults = getDefaultSettings();
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
  if (!snap.exists) return defaults;
  const filled = fillBlankSettingsFromDefaults(snap.data() as Settings, defaults);
  return {
    ...filled,
    integrations: normalizeStoredIntegrations(filled.integrations),
  };
}

export async function saveAdminSettings(updates: Partial<Settings>, updatedBy: string): Promise<Settings> {
  const ref = getAdminDb().collection('settings').doc(SETTINGS_DOC_ID);
  const existingSnap = await ref.get();
  const existing = existingSnap.exists
    ? fillBlankSettingsFromDefaults(existingSnap.data() as Settings, getDefaultSettings())
    : getDefaultSettings();

  const sanitizedUpdates: Partial<Settings> = {
    ...updates,
    integrations: updates.integrations
      ? omitBlankIntegrationSecrets(updates.integrations)
      : undefined,
  };

  const merged: Settings = {
    ...mergeSettingsUpdates(existing, sanitizedUpdates),
    id: SETTINGS_DOC_ID,
    updatedAt: Date.now(),
    updatedBy,
  };

  merged.integrations = normalizeStoredIntegrations(merged.integrations);

  await ref.set(merged);
  return merged;
}

export async function getPublicSettings(): Promise<Settings> {
  const { sanitizePublicSettings } = await import('@/lib/public-settings');
  return sanitizePublicSettings(await getAdminSettings());
}
