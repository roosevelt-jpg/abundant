import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Event } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getAdminDb();

    const bySlug = await db.collection('events').where('slug', '==', slug).limit(1).get();
    let event: Event | null = null;

    if (!bySlug.empty) {
      event = bySlug.docs[0].data() as Event;
    } else {
      const byId = await db.collection('events').doc(slug).get();
      if (byId.exists) event = byId.data() as Event;
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.isPublic || event.status === 'draft' || event.status === 'cancelled') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('[api/public/events/slug]', error);
    return NextResponse.json({ error: 'Failed to load event' }, { status: 500 });
  }
}
