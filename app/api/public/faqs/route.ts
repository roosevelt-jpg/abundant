import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FaqItem } from '@/lib/types';

export async function GET() {
  try {
    const snap = await getAdminDb()
      .collection('faqs')
      .where('isPublished', '==', true)
      .get();

    const faqs: FaqItem[] = snap.docs
      .map((d) => d.data() as FaqItem)
      .sort((a, b) => a.order - b.order)
      .map((data) => ({
        id: data.id,
        question: data.question,
        answer: data.answer,
        order: data.order,
        isPublished: true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }));

    return NextResponse.json(faqs);
  } catch (error) {
    console.error('[api/public/faqs]', error);
    return NextResponse.json([], { status: 200 });
  }
}
