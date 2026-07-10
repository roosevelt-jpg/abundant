import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { Testimonial } from '@/lib/types';
import { notifyMembersActivity } from '@/lib/notify-activity';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const content = String(body.content || '').trim();
    if (content.length < 20) {
      return NextResponse.json({ error: 'Please write a longer testimonial' }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection('testimonials').doc();
    const now = Date.now();
    const testimonial: Testimonial = {
      id: ref.id,
      content,
      authorName: String(body.authorName || user.email),
      authorTitle: String(body.authorTitle || ''),
      rating: 5,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };
    await ref.set({ ...testimonial, authorId: user.uid });

    await notifyMembersActivity({
      title: 'New testimonial submitted',
      body: `${testimonial.authorName} shared a testimonial for review.`,
      link: '/admin/testimonials',
    });

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    console.error('[api/members/testimonials]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
