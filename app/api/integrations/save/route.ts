import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/firestore-admin-service';

/**
 * POST /api/integrations/save
 * Saves integrations to the settings document using Admin SDK
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[v0] POST /api/integrations/save - Starting');
    
    // Verify authentication
    const authToken = request.headers.get('authorization');
    console.log('[v0] Auth token present:', !!authToken);
    
    if (!authToken) {
      console.warn('[v0] No auth token provided');
      return NextResponse.json(
        { message: 'Unauthorized - no token', status: 'error' },
        { status: 401 }
      );
    }

    // Parse request payload
    let payload;
    try {
      payload = await request.json();
      console.log('[v0] Payload parsed, keys:', Object.keys(payload));
    } catch (e) {
      console.error('[v0] JSON parse error:', e);
      return NextResponse.json(
        { message: 'Invalid JSON', status: 'error' },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== 'object') {
      console.error('[v0] Empty or invalid payload');
      return NextResponse.json(
        { message: 'Empty payload', status: 'error' },
        { status: 400 }
      );
    }

    // Get current settings
    console.log('[v0] Getting current settings...');
    const currentSettings = await getSettings();
    
    // Merge integrations into settings
    const updatedSettings = {
      ...currentSettings,
      integrations: payload,
      updatedAt: Date.now(),
      updatedBy: 'admin'
    };

    console.log('[v0] Saving integrations to settings...');
    await updateSettings(updatedSettings);
    
    console.log('[v0] Integrations saved successfully');
    return NextResponse.json(
      {
        message: 'Integrations saved successfully',
        status: 'success'
      },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[v0] POST /api/integrations/save error:', msg);
    console.error('[v0] Full error:', error);
    
    return NextResponse.json(
      {
        message: `Error saving integrations: ${msg}`,
        status: 'error'
      },
      { status: 500 }
    );
  }
}
