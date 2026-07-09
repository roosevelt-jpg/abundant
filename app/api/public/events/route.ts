import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const now = Date.now();

    const snap = await getAdminDb()
      .collection('events')
      .where('isPublic', '==', true)
      .get();

    const events = snap.docs
      .map((d) => d.data())
      .filter((e) => (e.date as number) >= now - 86400000)
      .sort((a, b) => (a.date as number) - (b.date as number))
      .slice(0, limit);

    return NextResponse.json(events);
  } catch (error) {
    console.error('[api/public/events]', error);
    return NextResponse.json([]);
  }
}
