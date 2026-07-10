import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { JobPosting } from '@/lib/types';

export async function GET() {
  try {
    const snap = await getAdminDb().collection('jobPostings').where('isPublished', '==', true).get();
    const items = snap.docs
      .map((d) => d.data() as JobPosting)
      .sort((a, b) => a.order - b.order);
    return NextResponse.json(items);
  } catch (error) {
    console.error('[api/public/jobs]', error);
    return NextResponse.json([]);
  }
}
