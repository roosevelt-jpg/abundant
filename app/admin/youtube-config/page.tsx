'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Play, Settings as SettingsIcon } from 'lucide-react';

interface YouTubeConfig {
  configured: boolean;
  channelId: string;
  apiKey?: string;
  autoFetchEnabled: boolean;
  fetchInterval: number;
  videosToDisplay: number;
  lastFetch?: number;
}

export default function YouTubeConfigPage() {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<YouTubeConfig>({
    configured: false,
    channelId: '',
    autoFetchEnabled: true,
    fetchInterval: 60,
    videosToDisplay: 3
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/youtube/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('[v0] Error loading YouTube config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/youtube/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMessage('YouTube configuration saved successfully!');
        await loadConfig();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error saving configuration');
      }
    } catch (error) {
      console.error('[v0] Error saving config:', error);
      setMessage('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleFetchVideos = async () => {
    try {
      setSaving(true);
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/youtube/fetch-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ channelId: config.channelId })
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
        setMessage(`Fetched ${data.videos?.length || 0} videos`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error fetching videos');
      }
    } catch (error) {
      console.error('[v0] Error fetching videos:', error);
      setMessage('Error fetching videos');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading YouTube configuration...</div>;
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Play className="text-red-600" size={28} />
          YouTube Integration
        </h1>
        <p className="text-muted-foreground mt-2">Configure YouTube channel and auto-fetch videos for homepage</p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Configuration Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <SettingsIcon size={20} />
            YouTube Channel Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">YouTube Channel ID</label>
              <input
                type="text"
                value={config.channelId}
                onChange={(e) => setConfig({ ...config, channelId: e.target.value })}
                placeholder="e.g., UCxxxxxxxxxxxxx"
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Find your channel ID at youtube.com/@yourhandle/about
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">YouTube API Key</label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Your YouTube Data API v3 key"
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get from <a href="https://console.cloud.google.com" target="_blank" className="underline">Google Cloud Console</a> - YouTube Data API v3
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Videos to Display</label>
                <input
                  type="number"
                  value={config.videosToDisplay}
                  onChange={(e) => setConfig({ ...config, videosToDisplay: parseInt(e.target.value) })}
                  min="1"
                  max="12"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fetch Interval (minutes)</label>
                <input
                  type="number"
                  value={config.fetchInterval}
                  onChange={(e) => setConfig({ ...config, fetchInterval: parseInt(e.target.value) })}
                  min="5"
                  max="1440"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.autoFetchEnabled}
                onChange={(e) => setConfig({ ...config, autoFetchEnabled: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm font-medium">Auto-fetch videos periodically</label>
            </div>

            {config.lastFetch && (
              <p className="text-xs text-muted-foreground">
                Last fetched: {new Date(config.lastFetch).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-accent text-accent-foreground py-2 rounded-lg font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              onClick={handleFetchVideos}
              disabled={!config.channelId || !config.apiKey || saving}
              className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg font-semibold hover:bg-secondary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Fetching...' : 'Fetch Videos Now'}
            </button>
          </div>
        </div>

        {/* Videos List */}
        {videos.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Videos ({videos.length})</h2>
            <div className="space-y-3">
              {videos.slice(0, config.videosToDisplay).map((video: any, idx: number) => (
                <div key={idx} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex gap-3">
                    {video.thumbnail && (
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-20 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{video.title}</p>
                      <p className="text-xs text-muted-foreground">{video.publishedAt}</p>
                      <a 
                        href={`https://youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        className="text-xs text-accent hover:underline"
                      >
                        Watch →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
