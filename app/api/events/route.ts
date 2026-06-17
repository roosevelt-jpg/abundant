import { NextRequest, NextResponse } from 'next/server';
import { getEvents, addEvent } from '@/lib/firestore-service';
import { verifyAdminToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error('[v0] Error in GET /api/events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request.headers.get('authorization'));
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const data = await request.json();
    const id = await addEvent(data);
    return NextResponse.json({ id, ...data }, { status: 201 });
  } catch (error) {
    console.error('[v0] Error in POST /api/events:', error);
    return NextResponse.json({ error: 'Failed to add event' }, { status: 500 });
  }
}
