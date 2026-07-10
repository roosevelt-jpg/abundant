import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { ResourceItem } from '@/lib/types';
import { ensureSeededContent } from '@/lib/seed-content';

export async function GET() {
  try {
    await ensureSeededContent();
    const snap = await getAdminDb().collection('resources').where('isPublished', '==', true).get();
    const items = snap.docs
      .map((d) => d.data() as ResourceItem)
      .sort((a, b) => a.order - b.order);
    return NextResponse.json(items);
  } catch (error) {
    console.error('[api/public/resources]', error);
    return NextResponse.json([]);
  }
}
