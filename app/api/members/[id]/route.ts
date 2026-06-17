import { NextRequest, NextResponse } from 'next/server';
import { updateMember, deleteMember } from '@/lib/firestore-service';
import { verifyAdminToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminToken(request.headers.get('authorization'));
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const data = await request.json();
    await updateMember(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in PUT /api/members/[id]:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminToken(request.headers.get('authorization'));
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await deleteMember(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in DELETE /api/members/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
