'use client';

import { useState, useEffect } from 'react';
import { Settings } from '@/lib/types';
import { HeroSliderEditor } from './editor';
import { useAuth } from '@/context/AuthContext';

export default function HeroSliderPage() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings', {
          cache: 'no-store',
          method: 'GET'
        });
        if (!response.ok) throw new Error('Failed to load settings');
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        console.error('[v0] Hero slider load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (updatedSettings: Settings) => {
    setIsSaving(true);
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedSettings)
      });

      if (!response.ok) throw new Error('Failed to save settings');
      setSettings(updatedSettings);
      alert('Hero slider settings saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      alert('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading hero slider settings...</div>;
  }

  if (error || !settings) {
    return (
      <div className="p-8 space-y-4">
        <div className="text-center text-destructive font-medium">
          {error || 'Failed to load settings'}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mx-auto px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hero Slider Management</h1>
        <p className="text-muted-foreground mt-2">Manage hero slider images and videos with custom speed, transitions, and call-to-action buttons</p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
          {error}
        </div>
      )}

      <HeroSliderEditor settings={settings} onSave={handleSave} isSaving={isSaving} />
    </div>
  );
}
