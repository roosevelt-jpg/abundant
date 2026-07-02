'use client';

import { useState } from 'react';
import { X, Plus, Eye, EyeOff, Upload } from 'lucide-react';
import { Settings } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { uploadImageToStorage } from '@/lib/firebase-storage';

interface HeroSliderEditorProps {
  settings: Settings;
  onSave: (settings: Settings) => Promise<void>;
  isSaving: boolean;
}

export const HeroSliderEditor = ({ settings, onSave, isSaving }: HeroSliderEditorProps) => {
  const { currentUser } = useAuth();
  const [sliderConfig, setSliderConfig] = useState(settings.heroSlider || {
    enabled: true,
    speed: 5000,
    transition: 'fade' as const,
    autoPlay: true,
    slides: []
  });

  const [newSlide, setNewSlide] = useState({
    type: 'image' as 'image' | 'video',
    url: '',
    title: '',
    subtitle: '',
    cta: { text: '', link: '' }
  });

  const [previewSlideIndex, setPreviewSlideIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const addSlide = () => {
    if (!newSlide.url) {
      alert('Please enter a media URL');
      return;
    }

    const slide = {
      id: `slide-${Date.now()}`,
      ...newSlide,
      order: sliderConfig.slides.length
    };

    setSliderConfig({
      ...sliderConfig,
      slides: [...sliderConfig.slides, slide]
    });

    setNewSlide({
      type: 'image',
      url: '',
      title: '',
      subtitle: '',
      cta: { text: '', link: '' }
    });
  };

  const removeSlide = (index: number) => {
    const newSlides = sliderConfig.slides.filter((_, i) => i !== index);
    setSliderConfig({ ...sliderConfig, slides: newSlides });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress('Uploading...');
      
      const fileType = newSlide.type === 'image' ? 'image' : 'video';
      if (fileType === 'image') {
        const url = await uploadImageToStorage(file, 'hero-slider');
        setNewSlide({ ...newSlide, url });
        setUploadProgress('');
      } else {
        const url = await uploadVideoToStorage(file, 'hero-slider-videos');
        setNewSlide({ ...newSlide, url });
        setUploadProgress('');
      }
    } catch (error) {
      console.error('[v0] Upload error:', error);
      setUploadProgress(`Error: ${error instanceof Error ? error.message : 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  };

  const uploadVideoToStorage = async (file: File, folder: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.url;
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sliderConfig.slides.length - 1)) {
      return;
    }

    const newSlides = [...sliderConfig.slides];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];

    setSliderConfig({ ...sliderConfig, slides: newSlides });
  };

  const handleSave = async () => {
    if (sliderConfig.slides.length === 0) {
      alert('Please add at least one slide');
      return;
    }

    const updatedSettings: Settings = {
      ...settings,
      heroSlider: sliderConfig,
      updatedAt: Date.now(),
      updatedBy: currentUser?.email || 'unknown'
    };

    await onSave(updatedSettings);
  };

  return (
    <div className="space-y-8">
      {/* Slider Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Slider Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Speed (milliseconds)</label>
            <input
              type="number"
              value={sliderConfig.speed || 5000}
              onChange={(e) => setSliderConfig({ ...sliderConfig, speed: parseInt(e.target.value) })}
              min="1000"
              step="1000"
              className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-muted-foreground mt-1">Time between slides in milliseconds (1000-60000)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Transition</label>
            <select
              value={sliderConfig.transition || 'fade'}
              onChange={(e) => setSliderConfig({ ...sliderConfig, transition: e.target.value as 'fade' | 'slide' })}
              className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <input
            type="checkbox"
            checked={sliderConfig.autoPlay !== false}
            onChange={(e) => setSliderConfig({ ...sliderConfig, autoPlay: e.target.checked })}
            className="rounded"
          />
          <label className="text-sm font-medium">Auto-play slides</label>
        </div>
      </div>

      {/* Add New Slide */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Slide</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Media Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newSlide.type === 'image'}
                  onChange={() => setNewSlide({ ...newSlide, type: 'image' })}
                />
                <span className="text-sm">Image</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newSlide.type === 'video'}
                  onChange={() => setNewSlide({ ...newSlide, type: 'video' })}
                />
                <span className="text-sm">Video</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Media Upload or URL</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <label className="flex-1">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-accent/10 border-2 border-dashed border-accent rounded-lg cursor-pointer hover:bg-accent/20 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {uploading ? 'Uploading...' : `Choose ${newSlide.type}`}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept={newSlide.type === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              {uploadProgress && (
                <p className="text-sm text-accent">{uploadProgress}</p>
              )}
              {newSlide.url && (
                <p className="text-xs text-muted-foreground break-all">✓ URL: {newSlide.url.substring(0, 60)}...</p>
              )}
              <p className="text-xs text-muted-foreground">Or paste URL below:</p>
              <input
                type="url"
                value={newSlide.url}
                onChange={(e) => setNewSlide({ ...newSlide, url: e.target.value })}
                placeholder="https://storage-url.com/image.jpg"
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={newSlide.title}
              onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
              placeholder="Slide title"
              className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subtitle</label>
            <input
              type="text"
              value={newSlide.subtitle}
              onChange={(e) => setNewSlide({ ...newSlide, subtitle: e.target.value })}
              placeholder="Slide subtitle"
              className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">CTA Button Text</label>
              <input
                type="text"
                value={newSlide.cta.text}
                onChange={(e) => setNewSlide({ ...newSlide, cta: { ...newSlide.cta, text: e.target.value } })}
                placeholder="e.g., Learn More"
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CTA Link</label>
              <input
                type="url"
                value={newSlide.cta.link}
                onChange={(e) => setNewSlide({ ...newSlide, cta: { ...newSlide.cta, link: e.target.value } })}
                placeholder="https://example.com"
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <button
            onClick={addSlide}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Slide
          </button>
        </div>
      </div>

      {/* Slides List */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Slides ({sliderConfig.slides.length})</h3>
        
        {sliderConfig.slides.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No slides added yet. Add your first slide above.</p>
        ) : (
          <div className="space-y-4">
            {sliderConfig.slides.map((slide, idx) => (
              <div key={slide.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium">{slide.title || `Slide ${idx + 1}`}</p>
                    <p className="text-xs text-muted-foreground">{slide.type.charAt(0).toUpperCase() + slide.type.slice(1)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewSlideIndex(previewSlideIndex === idx ? null : idx)}
                      className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                    >
                      {previewSlideIndex === idx ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => removeSlide(idx)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {previewSlideIndex === idx && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-border h-40 bg-muted">
                    {slide.type === 'video' ? (
                      <video src={slide.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={slide.url} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">URL: {slide.url.substring(0, 50)}...</p>
                  </div>
                  {slide.subtitle && (
                    <p className="text-muted-foreground">Subtitle: {slide.subtitle}</p>
                  )}
                  {slide.cta?.text && (
                    <p className="text-muted-foreground">CTA: {slide.cta.text} → {slide.cta.link}</p>
                  )}
                </div>

                <div className="flex gap-2 mt-3 border-t border-border pt-3">
                  <button
                    onClick={() => moveSlide(idx, 'up')}
                    disabled={idx === 0}
                    className="text-xs px-3 py-1 bg-accent/10 hover:bg-accent/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Move Up
                  </button>
                  <button
                    onClick={() => moveSlide(idx, 'down')}
                    disabled={idx === sliderConfig.slides.length - 1}
                    className="text-xs px-3 py-1 bg-accent/10 hover:bg-accent/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Move Down
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving...' : 'Save Hero Slider Settings'}
      </button>
    </div>
  );
};
