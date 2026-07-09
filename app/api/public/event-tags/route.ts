import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { EventTag } from '@/lib/types';

export async function GET() {
  try {
    const snap = await getAdminDb().collection('eventTags').get();
    const tags: EventTag[] = snap.docs
      .map((d) => d.data() as EventTag)
      .filter((t) => t.active)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return NextResponse.json(tags);
  } catch (error) {
    console.error('[api/public/event-tags]', error);
    return NextResponse.json([]);
  }
}
