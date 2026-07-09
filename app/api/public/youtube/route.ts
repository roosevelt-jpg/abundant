import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { Settings } from '@/lib/types';

export async function GET() {
  try {
    const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
    if (!snap.exists) return NextResponse.json([]);

    const settings = snap.data() as Settings;
    const apiKey = settings.integrations?.youtube?.apiKey;
    const channelId = settings.integrations?.youtube?.channelId;

    if (!apiKey || !channelId || !settings.youtubeSection?.enabled) {
      return NextResponse.json([]);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=3&order=date&type=video&key=${apiKey}`
    );

    if (!response.ok) return NextResponse.json([]);

    const data = await response.json();
    const videos = (data.items || []).map((item: { id: { videoId: string }; snippet: { title: string; thumbnails: { high?: { url: string }; medium?: { url: string } }; channelTitle: string; publishedAt: string } }) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    return NextResponse.json(videos);
  } catch (error) {
    console.error('[api/public/youtube]', error);
    return NextResponse.json([]);
  }
}
