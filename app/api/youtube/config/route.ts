import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyAdminToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json({
        configured: false,
        channelId: '',
        autoFetchEnabled: true,
        fetchInterval: 60,
        videosToDisplay: 3
      });
    }

    const doc = await db.collection('settings').doc('youtube').get();
    const config = doc.data() || {
      configured: false,
      channelId: '',
      autoFetchEnabled: true,
      fetchInterval: 60,
      videosToDisplay: 3
    };

    // Never return API key to client
    const { apiKey, ...safeConfig } = config;
    return NextResponse.json(safeConfig, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error('[v0] Error fetching YouTube config:', error);
    return NextResponse.json({
      configured: false,
      channelId: '',
      autoFetchEnabled: true,
      fetchInterval: 60,
      videosToDisplay: 3
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const config = await request.json();

    await db.collection('settings').doc('youtube').set({
      ...config,
      configured: !!config.channelId && !!config.apiKey,
      updatedAt: Date.now()
    });

    // Return safe config without API key
    const { apiKey, ...safeConfig } = config;
    return NextResponse.json({ success: true, config: safeConfig });
  } catch (error) {
    console.error('[v0] Error saving YouTube config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save config' },
      { status: 500 }
    );
  }
}
