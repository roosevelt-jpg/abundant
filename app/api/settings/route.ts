import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/firestore-service';
import { verifyAdminToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';

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
    const authToken = request.headers.get('authorization');
    const isAdmin = await verifyAdminToken(authToken);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    // Note: updateSettings uses the client SDK, which doesn't require direct user ID
    // It will use the authenticated user's ID from the JWT token
    await updateSettings(data, 'admin');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in PUT /api/settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

