import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json([]);
    }

    // Get YouTube config to see how many videos to display
    const configDoc = await db.collection('settings').doc('youtube').get();
    const config = configDoc.data();
    const limit = config?.videosToDisplay || 3;

    // Get videos from Firestore
    const snapshot = await db.collection('youtubeVideos')
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .get();

    const videos: any[] = [];
    snapshot.forEach((doc: any) => {
      videos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json(videos, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error('[v0] Error fetching YouTube videos:', error);
    return NextResponse.json([]);
  }
}
