import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-server';

/**
 * GET /api/integrations
 * Fetches saved integrations from Firestore
 * Used by admin to load previously saved configurations
 */
export async function GET() {
  try {
    console.log('[v0] GET /api/integrations - Fetching saved integrations');
    
    const db = await getDb();
    
    if (!db) {
      console.warn('[v0] Database not available, returning empty integrations');
      return NextResponse.json(
        {
          firebaseAdmin: {},
          firebaseClient: {},
          gmailSmtp: {},
          stripe: {},
          paypal: {},
          googleCalendar: {},
          microsoftCalendar: {},
          youtube: {},
          googlePlaces: {}
        },
        { status: 200 }
      );
    }

    // Fetch from settings.main document
    const settingsRef = db.collection('settings').doc('main');
    const docSnap = await settingsRef.get();

    if (!docSnap.exists) {
      console.log('[v0] No saved integrations found');
      return NextResponse.json(
        {
          firebaseAdmin: {},
          firebaseClient: {},
          gmailSmtp: {},
          stripe: {},
          paypal: {},
          googleCalendar: {},
          microsoftCalendar: {},
          youtube: {},
          googlePlaces: {}
        },
        { status: 200 }
      );
    }

    const data = docSnap.data();
    const integrations = data?.integrations || {};
    
    console.log('[v0] Integrations loaded, count:', Object.keys(integrations).length);
    
    return NextResponse.json(integrations, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[v0] GET /api/integrations error:', msg);
    
    // Gracefully return empty integrations on error
    return NextResponse.json(
      {
        firebaseAdmin: {},
        firebaseClient: {},
        gmailSmtp: {},
        stripe: {},
        paypal: {},
        googleCalendar: {},
        microsoftCalendar: {},
        youtube: {},
        googlePlaces: {}
      },
      { status: 200 }
    );
  }
}
