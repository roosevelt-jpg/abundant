import { NextResponse } from 'next/server';

/**
 * GET /api/integrations
 * Fetches saved integrations from the settings document
 * Always returns a valid integrations object even if database unavailable
 */
export async function GET() {
  try {
    console.log('[v0] GET /api/integrations - Fetching');
    
    let settings;
    try {
      // Dynamically import to avoid server-side-only issues
      const { getSettings } = await import('@/lib/firestore-admin-service');
      settings = await getSettings();
    } catch (settingsError) {
      const msg = settingsError instanceof Error ? settingsError.message : String(settingsError);
      console.error('[v0] getSettings error:', msg);
      // Return empty on error
      return NextResponse.json({}, { status: 200 });
    }
    
    console.log('[v0] Settings fetched, integrations:', !!settings?.integrations);
    
    // Return integrations from settings, or empty object if not configured
    const integrations = settings?.integrations || {};
    
    return NextResponse.json(integrations, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[v0] GET /api/integrations unexpected error:', msg);
    console.error('[v0] Error:', error);
    
    // Always return empty integrations on error
    return NextResponse.json({}, { status: 200 });
  }
}
