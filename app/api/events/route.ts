import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyAdminToken } from '@/lib/firebase-admin-server';
import type { Event } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get('public') === 'true';

    const db = await getDb();
    if (!db) {
      return NextResponse.json([]);
    }

    try {
      let query: any = db.collection('events');

      if (publicOnly) {
        query = query.where('isPublic', '==', true);
      }

      const snapshot = await query.orderBy('date', 'desc').limit(10).get();
      const events: Event[] = [];
      snapshot.forEach((doc: any) => {
        try {
          events.push(doc.data() as Event);
        } catch (e) {
          console.warn('[v0] Error parsing event document:', e);
        }
      });

      return NextResponse.json(events, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    } catch (dbError) {
      console.warn('[v0] Database query error (non-critical):', dbError instanceof Error ? dbError.message : String(dbError));
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('[v0] Error in GET /api/events:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const docRef = db.collection('events').doc();
    const newEvent: Event = {
      ...data,
      id: docRef.id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await docRef.set(newEvent);
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('[v0] Error creating event:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create event' },
      { status: 500 }
    );
  }
}
