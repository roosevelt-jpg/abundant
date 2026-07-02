'use client';

import { useState, useEffect } from 'react';
import { Settings } from '@/lib/types';
import { Play } from 'lucide-react';

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
        const response = await fetch('/api/youtube/config');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('[v0] YouTubeWidget: Error loading settings:', error);
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

        const response = await fetch('/api/youtube/videos');
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }

        const data = await response.json();
        const formattedVideos: YouTubeVideo[] = (data || []).map((item: any) => ({
          id: item.videoId || item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          channelTitle: item.channelTitle || 'Abundant Global Club',
          publishedAt: item.publishedAt || new Date().toISOString(),
        }));

        setVideos(formattedVideos);
      } catch (err) {
        console.error('[v0] YouTube fetch error:', err);
        setError(null); // Don't show error - just hide section
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchYouTubeVideos();
  }, []);

  if (!loading && videos.length === 0) {
    return null; // Hide widget if no videos
  }

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (videos.length === 0) {
    return null; // Hide if no videos
  }

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Featured Videos</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Watch our latest content and insights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="p-4">
                <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-accent transition-colors">
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
      </div>
    </section>
  );
};
