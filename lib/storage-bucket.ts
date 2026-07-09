import { getAdminSettings } from '@/lib/settings-server';

function pushUnique(list: string[], value?: string | null) {
  const trimmed = value?.trim();
  if (trimmed && !list.includes(trimmed)) list.push(trimmed);
}

/** Resolve Firebase Storage bucket names, most preferred first. */
export async function getStorageBucketCandidates(): Promise<string[]> {
  const candidates: string[] = [];

  try {
    const settings = await getAdminSettings();
    pushUnique(candidates, settings.integrations?.firebaseClient?.storageBucket);

    const projectId =
      settings.integrations?.firebaseClient?.projectId ||
      settings.integrations?.firebaseAdmin?.projectId;

    if (projectId) {
      pushUnique(candidates, `${projectId}.firebasestorage.app`);
      pushUnique(candidates, `${projectId}.appspot.com`);
    }
  } catch {
    // Fall through to env-based resolution
  }

  pushUnique(candidates, process.env.FIREBASE_STORAGE_BUCKET);
  pushUnique(candidates, process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

  const envProjectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (envProjectId) {
    pushUnique(candidates, `${envProjectId}.firebasestorage.app`);
    pushUnique(candidates, `${envProjectId}.appspot.com`);
  }

  return candidates;
}

export function isBucketNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /bucket does not exist|404|Not Found/i.test(message);
}
