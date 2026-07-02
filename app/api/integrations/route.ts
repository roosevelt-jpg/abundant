import { NextResponse } from 'next/server';

/**
 * GET /api/integrations
 * Returns empty integrations object
 * Client-side manages integrations state due to Firestore unavailability
 */
export async function GET() {
  try {
    console.log('[v0] GET /api/integrations');
    
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
  } catch (error) {
    console.error('[v0] Error:', error);
    return NextResponse.json({}, { status: 200 });
  }
}
