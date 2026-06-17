import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/firestore-service';

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

// GET /api/settings
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('[v0] Error in GET /api/settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const decodedToken = await getAuth().verifyIdToken(request.headers.get('authorization')!.replace('Bearer ', ''));
    await updateSettings(data, decodedToken.uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in PUT /api/settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
