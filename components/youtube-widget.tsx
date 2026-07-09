'use client';

import { useState, useEffect } from 'react';
import { Settings } from '@/lib/types';
import { Play } from 'lucide-react';

function getGridCols(count: number): string {
  if (count <= 1) return 'grid-cols-1 max-w-md mx-auto';
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
  if (count <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

interface YouTubeWidgetProps {
  settings?: Settings | null;
}

export const YouTubeWidget = ({ settings: initialSettings }: YouTubeWidgetProps) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(initialSettings || null);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      return;
    }

    // Load settings on client side if not provided
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/public/settings');
        if (res.ok) setSettings(await res.json());
      } catch {
        setLoading(false);
      }
    };
    loadSettings();
  }, [initialSettings]);

  useEffect(() => {
    const fetchYouTubeVideos = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!settings?.youtubeSection?.enabled) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/public/youtube');
        if (!response.ok) throw new Error('Failed to fetch YouTube videos');

        const formattedVideos = await response.json();
        setVideos(formattedVideos);
      } catch (err) {
        console.error('YouTube fetch error:', err);
        setError('Failed to load YouTube videos');
      } finally {
        setLoading(false);
      }
    };

    if (settings?.youtubeSection?.enabled) {
      fetchYouTubeVideos();
    }
  }, [settings?.youtubeSection?.enabled]);

  if (!settings?.youtubeSection?.enabled) {
    return null;
  }

  const videoCount = settings.youtubeSection.videosPerPage ?? 3;
  const gridClass = getGridCols(videoCount);

  return (
    <section className="py-8 md:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
            {settings.youtubeSection.title || 'Featured Videos'}
          </h2>
          {settings.youtubeSection.description && (
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {settings.youtubeSection.description}
            </p>
          )}
        </div>

        {loading && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Loading videos...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <div className="inline-block px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No videos found</p>
          </div>
        )}

        {!loading && !error && videos.length > 0 && (
          <div className={`grid ${gridClass} gap-4`}>
            {videos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg overflow-hidden bg-card border border-border hover:border-accent transition-all"
              >
                <div className="relative pb-[56.25%] bg-black overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <Play className="w-16 h-16 text-white fill-white opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold line-clamp-2 mb-1 group-hover:text-accent transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{video.channelTitle}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
