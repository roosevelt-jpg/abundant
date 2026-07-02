import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/firestore-admin-service';
import { verifyAdminToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET /api/settings
export async function GET() {
  try {
    console.log('[v0] GET /api/settings - Fetching settings');
    const startTime = Date.now();
    
    const settings = await getSettings();
    
    const duration = Date.now() - startTime;
    console.log(`[v0] Settings fetched in ${duration}ms`);
    
    return NextResponse.json(settings, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[v0] GET /api/settings error:', msg);
    return NextResponse.json(
      { error: 'Failed to fetch settings', message: msg }, 
      { status: 500 }
    );
  }
}

// POST /api/settings (save)
export async function POST(request: NextRequest) {
  try {
    console.log('[v0] POST /api/settings - Saving settings');
    
    const authToken = request.headers.get('authorization');
    console.log('[v0] Auth token present:', !!authToken);
    
    const isAdmin = await verifyAdminToken(authToken);
    console.log('[v0] Admin verification result:', isAdmin);
    
    if (!isAdmin) {
      console.warn('[v0] Unauthorized settings update attempt');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin token required' }, 
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log('[v0] Request data received, keys:', Object.keys(data));
    
    await updateSettings(data);
    
    console.log('[v0] Settings updated successfully');
    return NextResponse.json(
      { 
        success: true, 
        message: 'Settings saved successfully',
        status: 'success'
      }, 
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[v0] POST /api/settings error:', msg);
    console.error('[v0] Full error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update settings', 
        message: msg,
        status: 'error'
      }, 
      { status: 500 }
    );
  }
}

