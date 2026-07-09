import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snap = await getAdminDb()
      .collection('pages')
      .where('isPublished', '==', true)
      .get();
    const pages = snap.docs.map((d) => d.data());
    return NextResponse.json(pages);
  } catch (error) {
    console.error('[api/public/pages]', error);
    return NextResponse.json([]);
  }
}
