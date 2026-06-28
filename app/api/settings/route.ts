import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/firestore-admin-service';
import { verifyAdminToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET /api/settings
export async function GET() {
  try {
    console.log('[v0] Fetching settings from Admin SDK...');
    const startTime = Date.now();
    
    const settings = await getSettings();
    
    const duration = Date.now() - startTime;
    console.log(`[v0] Settings fetched in ${duration}ms`);
    
    return NextResponse.json(settings || {}, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('[v0] Error in GET /api/settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST /api/settings
export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization');
    const isAdmin = await verifyAdminToken(authToken);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await updateSettings(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in POST /api/settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

