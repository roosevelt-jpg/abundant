import { NextRequest, NextResponse } from 'next/server';
import { getPages, addPage } from '@/lib/firestore-service';
import { verifyAdminToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pages = await getPages();
    return NextResponse.json(pages);
  } catch (error) {
    console.error('[v0] Error in GET /api/pages:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request.headers.get('authorization'));
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const data = await request.json();
    const id = await addPage(data, 'admin');
    return NextResponse.json({ id, ...data }, { status: 201 });
  } catch (error) {
    console.error('[v0] Error in POST /api/pages:', error);
    return NextResponse.json({ error: 'Failed to add page' }, { status: 500 });
  }
}
