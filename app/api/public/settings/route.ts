import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { getDefaultSettings } from '@/lib/db-service';
import { sanitizePublicSettings } from '@/lib/public-settings';
import { Settings } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
    if (!snap.exists) {
      return NextResponse.json(sanitizePublicSettings(getDefaultSettings()), {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }
    return NextResponse.json(sanitizePublicSettings(snap.data() as Settings), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('[api/public/settings]', error);
    return NextResponse.json(sanitizePublicSettings(getDefaultSettings()), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }
}
