import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-server';

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Integrations save request received');

    let payload;
    try {
      payload = await request.json();
      console.log('[v0] Payload parsed successfully');
    } catch (parseError) {
      console.error('[v0] JSON parse error:', parseError);
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Verify minimum required data
    if (!payload || typeof payload !== 'object') {
      console.warn('[v0] Empty or invalid payload');
      return NextResponse.json(
        { message: 'No integration data provided' },
        { status: 400 }
      );
    }

    // Get database connection
    let db;
    try {
      db = await getDb();
      console.log('[v0] Database connection established');
    } catch (dbError) {
      console.error('[v0] Database connection error:', dbError);
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 503 }
      );
    }

    // If database not available, still return success for first-time setup
    if (!db) {
      console.warn('[v0] Database not initialized, but returning success');
      return NextResponse.json(
        {
          message: 'Integrations received (database setup pending)',
          status: 'pending'
        },
        { status: 200 }
      );
    }

    // Save to Firestore
    const settingsRef = db.collection('settings').doc('main');

    try {
      const docSnap = await settingsRef.get();

      if (docSnap.exists) {
        console.log('[v0] Updating existing settings document');
        await settingsRef.update({
          integrations: payload,
          updatedAt: new Date(),
          updatedBy: 'admin'
        });
      } else {
        console.log('[v0] Creating new settings document');
        await settingsRef.set({
          id: 'main',
          integrations: payload,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: 'admin'
        });
      }

      console.log('[v0] Integrations saved successfully');
      return NextResponse.json(
        {
          message: 'Integrations saved successfully',
          status: 'success'
        },
        { status: 200 }
      );
    } catch (writeError) {
      console.error('[v0] Firestore write error:', writeError);
      return NextResponse.json(
        {
          message: `Database error: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[v0] Unhandled error in integrations save:', error);
    return NextResponse.json(
      {
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}
