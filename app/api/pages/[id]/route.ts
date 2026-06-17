import { NextRequest, NextResponse } from 'next/server';
import { updatePage, deletePage } from '@/lib/firestore-service';

async function verifyAdmin(authToken: string | null | undefined) {
  if (!authToken) return false;
  try {
    const token = authToken.replace('Bearer ', '');
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken.email === 'admin@abundantglobalclub.com';
  } catch (error) {
    return false;
  }
}

// PUT /api/pages/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isAdmin = await verifyAdmin(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await updatePage(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in PUT /api/pages/[id]:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

// DELETE /api/pages/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isAdmin = await verifyAdmin(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deletePage(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in DELETE /api/pages/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}
