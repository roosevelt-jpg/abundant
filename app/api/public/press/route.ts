import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { PressItem } from '@/lib/types';

export async function GET() {
  try {
    const snap = await getAdminDb().collection('pressItems').where('isPublished', '==', true).get();
    const items = snap.docs
      .map((d) => d.data() as PressItem)
      .sort((a, b) => a.order - b.order);
    return NextResponse.json(items);
  } catch (error) {
    console.error('[api/public/press]', error);
    return NextResponse.json([]);
  }
}
