import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Event } from '@/lib/types';

/** Public guest names for events that opt into showGuestList */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getAdminDb();

    let event: Event | null = null;
    const bySlug = await db.collection('events').where('slug', '==', slug).limit(1).get();
    if (!bySlug.empty) event = bySlug.docs[0].data() as Event;
    else {
      const byId = await db.collection('events').doc(slug).get();
      if (byId.exists) event = byId.data() as Event;
    }

    if (!event?.showGuestList || !event.isPublic) {
      return NextResponse.json([]);
    }

    const regs = await db.collection('eventRegistrations').where('eventId', '==', event.id).get();

    return NextResponse.json(
      regs.docs
        .map((d) => d.data())
        .filter((data) => data.status === 'registered' || data.status === 'attended')
        .map((data) => ({
          id: data.id,
          userName: data.userName,
          status: data.status,
        }))
    );
  } catch (error) {
    console.error('[api/public/events/guests]', error);
    return NextResponse.json([]);
  }
}
