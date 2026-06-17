import { NextRequest, NextResponse } from 'next/server';
import { updateTestimonial, deleteTestimonial } from '@/lib/firestore-service';
import { verifyAdminToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';

// PUT /api/testimonials/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminToken(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    await updateTestimonial(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in PUT /api/testimonials/[id]:', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}

// DELETE /api/testimonials/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminToken(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteTestimonial(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in DELETE /api/testimonials/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
