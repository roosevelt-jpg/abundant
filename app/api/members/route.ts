import { NextRequest, NextResponse } from 'next/server';
import { getMembers, updateMember } from '@/lib/firestore-service';
import { verifyAdminToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const members = await getMembers();
    return NextResponse.json(members);
  } catch (error) {
    console.error('[v0] Error in GET /api/members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request.headers.get('authorization'));
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const data = await request.json();
    // Members are created through the signup flow, not via API
    // This endpoint is reserved for future use
    return NextResponse.json({ error: 'Use signup flow to create members' }, { status: 400 });
  } catch (error) {
    console.error('[v0] Error in POST /api/members:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

