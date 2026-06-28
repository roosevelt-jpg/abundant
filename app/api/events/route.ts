import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyAdminToken } from '@/lib/firebase-admin-server';
import type { Event } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const publicOnly = searchParams.get('public') === 'true';

    const db = await getDb();
    if (!db) {
      console.warn('[v0] Database not initialized');
      return NextResponse.json([]);
    }

    let query: any = db.collection('events');

    if (status) {
      query = query.where('status', '==', status);
    }

    if (publicOnly) {
      query = query.where('isPublic', '==', true);
    }

    const snapshot = await query.orderBy('date', 'desc').get();
    const events: Event[] = [];
    snapshot.forEach((doc: any) => {
      events.push(doc.data() as Event);
    });

    return NextResponse.json(events, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error('[v0] Error fetching events:', error);
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
