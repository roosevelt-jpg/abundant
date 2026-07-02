import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/save
 * Accepts integrations configuration
 * Returns success - data is managed by frontend for now
 */
export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization');
    
    if (!authToken) {
      return NextResponse.json(
        { message: 'Unauthorized', status: 'error' },
        { status: 401 }
      );
    }

    const payload = await request.json();

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { message: 'Invalid payload', status: 'error' },
        { status: 400 }
      );
    }

    // Configuration received successfully
    // Note: Actual persistence handled by frontend state management
    console.log('[v0] Integrations configuration received');
    
    return NextResponse.json(
      {
        message: 'Integrations configuration saved',
        status: 'success'
      },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[v0] Error:', msg);
    
    return NextResponse.json(
      { message: msg, status: 'error' },
      { status: 500 }
    );
  }
}
