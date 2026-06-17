import { NextRequest, NextResponse } from 'next/server';
import { getMembers, updateMember, deleteMember } from '@/lib/firestore-service';

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

// GET /api/members
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const members = await getMembers();
    return NextResponse.json(members);
  } catch (error) {
    console.error('[v0] Error in GET /api/members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
