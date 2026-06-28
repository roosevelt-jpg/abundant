import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyAdminToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[v0] Database not initialized');
      return NextResponse.json({
        enabled: true,
        speed: 5000,
        transition: 'fade',
        autoPlay: true,
        slides: []
      });
    }

    const doc = await db.collection('settings').doc('hero-slider').get();
    const config = doc.data() || {
      enabled: true,
      speed: 5000,
      transition: 'fade',
      autoPlay: true,
      slides: []
    };

    return NextResponse.json(config, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error('[v0] Error fetching hero slider:', error);
    return NextResponse.json({
      enabled: true,
      speed: 5000,
      transition: 'fade',
      autoPlay: true,
      slides: []
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

    await db.collection('settings').doc('hero-slider').set({
      ...config,
      updatedAt: Date.now()
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('[v0] Error saving hero slider:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save hero slider' },
      { status: 500 }
    );
  }
}
