import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/api-auth';
import { logActivityServer } from '@/lib/activity-log';
import { Testimonial } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();

    if (!body.authorName || !body.content) {
      return NextResponse.json({ error: 'Author name and content are required' }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection('testimonials').doc();
    const now = Date.now();

    const testimonial: Testimonial = {
      id: ref.id,
      authorName: body.authorName,
      authorTitle: body.authorTitle || '',
      content: body.content,
      rating: body.rating ?? 5,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(testimonial);

    await logActivityServer({
      type: 'create',
      entity: 'testimonial',
      entityId: testimonial.id,
      description: `Testimonial added by ${testimonial.authorName}`,
      actorId: admin.uid,
      actorName: admin.email,
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    console.error('[api/admin/testimonials POST]', error);
    const message = error instanceof Error ? error.message : 'Failed to create testimonial';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await getAdminDb().collection('testimonials').doc(id).update({
      ...updates,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/admin/testimonials PATCH]', error);
    const message = error instanceof Error ? error.message : 'Failed to update testimonial';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await getAdminDb().collection('testimonials').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/admin/testimonials DELETE]', error);
    const message = error instanceof Error ? error.message : 'Failed to delete testimonial';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
