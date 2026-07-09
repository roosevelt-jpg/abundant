import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Event } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const now = Date.now();

    const snap = await getAdminDb()
      .collection('events')
      .where('isPublic', '==', true)
      .get();

    let events = snap.docs
      .map((d) => d.data() as Event)
      .filter((e) => e.status !== 'cancelled' && e.status !== 'draft');

    if (limitParam !== 'all') {
      events = events.filter((e) => e.date >= now - 86400000);
    }

    events.sort((a, b) => a.date - b.date);

    if (limit && limit > 0) {
      events = events.slice(0, limit);
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('[api/public/events]', error);
    return NextResponse.json([]);
  }
}
