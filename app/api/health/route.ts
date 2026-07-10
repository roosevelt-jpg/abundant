import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Production diagnostics — no secrets returned. */
export async function GET() {
  const env = {
    hasAdminProjectId: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID),
    hasAdminClientEmail: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL),
    hasAdminPrivateKey: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY),
    privateKeyLooksPem: Boolean(
      (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').includes('BEGIN')
    ),
    nodeEnv: process.env.NODE_ENV,
  };

  let adminImport: 'ok' | string = 'ok';
  try {
    await import('firebase-admin/app');
  } catch (err) {
    adminImport = err instanceof Error ? err.message : String(err);
  }

  let adminInit: 'ok' | string = 'skipped';
  let firestoreRead: 'ok' | string = 'skipped';
  if (adminImport === 'ok') {
    try {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      const db = getAdminDb();
      adminInit = 'ok';
      try {
        await db.collection('settings').limit(1).get();
        firestoreRead = 'ok';
      } catch (err) {
        firestoreRead = err instanceof Error ? err.message : String(err);
      }
    } catch (err) {
      adminInit = err instanceof Error ? err.message : String(err);
    }
  }

  const ok = adminImport === 'ok' && adminInit === 'ok' && firestoreRead === 'ok';
  return NextResponse.json(
    { ok, env, adminImport, adminInit, firestoreRead },
    { status: ok ? 200 : 503 }
  );
}
