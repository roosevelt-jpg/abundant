import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { getDefaultSettings } from '@/lib/db-service';
import { sanitizePublicSettings } from '@/lib/public-settings';
import { Settings } from '@/lib/types';

export async function GET() {
  try {
    const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
    if (!snap.exists) {
      return NextResponse.json(sanitizePublicSettings(getDefaultSettings()));
    }
    return NextResponse.json(sanitizePublicSettings(snap.data() as Settings));
  } catch (error) {
    console.error('[api/public/settings]', error);
    return NextResponse.json(sanitizePublicSettings(getDefaultSettings()));
  }
}
