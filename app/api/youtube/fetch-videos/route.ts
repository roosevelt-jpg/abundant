import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyAdminToken } from '@/lib/firebase-admin-server';

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

    // Get YouTube config from Firestore
    const configDoc = await db.collection('settings').doc('youtube').get();
    const config = configDoc.data();

    if (!config?.channelId || !config?.apiKey) {
      return NextResponse.json(
        { error: 'YouTube channel ID or API key not configured' },
        { status: 400 }
      );
    }

    console.log('[v0] Fetching videos from channel:', config.channelId);

    // Call YouTube Data API to get uploads playlist
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forUsername=${encodeURIComponent(config.channelId)}&key=${config.apiKey}`
    );

    if (!searchResponse.ok) {
      // Try alternative approach with ID directly
      const altResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(config.channelId)}&key=${config.apiKey}`
      );

      if (!altResponse.ok) {
        throw new Error('Failed to fetch channel info');
      }

      const channelData = await altResponse.json();
      if (!channelData.items?.[0]) {
        throw new Error('Channel not found');
      }

      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

      // Get videos from uploads playlist
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${config.videosToDisplay || 3}&order=date&key=${config.apiKey}`
      );

      if (!videosResponse.ok) {
        throw new Error('Failed to fetch videos');
      }

      const videosData = await videosResponse.json();
      const videos = (videosData.items || []).map((item: any) => ({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
        channelTitle: item.snippet.channelTitle
      }));

      // Save videos to Firestore
      if (videos.length > 0) {
        const videosCollection = db.collection('youtubeVideos');
        for (const video of videos) {
          await videosCollection.doc(video.videoId).set(video, { merge: true });
        }

        // Update last fetch time
        await db.collection('settings').doc('youtube').update({
          lastFetch: Date.now()
        });
      }

      return NextResponse.json({ success: true, videos, count: videos.length });
    }

    const channelData = await searchResponse.json();
    if (!channelData.items?.[0]) {
      throw new Error('Channel not found');
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Get videos from uploads playlist
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${config.videosToDisplay || 3}&order=date&key=${config.apiKey}`
    );

    if (!videosResponse.ok) {
      throw new Error('Failed to fetch videos');
    }

    const videosData = await videosResponse.json();
    const videos = (videosData.items || []).map((item: any) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
      channelTitle: item.snippet.channelTitle
    }));

    // Save videos to Firestore
    if (videos.length > 0) {
      const videosCollection = db.collection('youtubeVideos');
      for (const video of videos) {
        await videosCollection.doc(video.videoId).set(video, { merge: true });
      }

      // Update last fetch time
      await db.collection('settings').doc('youtube').update({
        lastFetch: Date.now()
      });
    }

    return NextResponse.json({ success: true, videos, count: videos.length });
  } catch (error) {
    console.error('[v0] Error fetching YouTube videos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
