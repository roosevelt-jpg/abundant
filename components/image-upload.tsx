'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/storage-service';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, folder = 'uploads', label = 'Image', className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    try {
      setUploading(true);
      setError('');
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Try a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {value && (
        <div className="relative mb-3 w-full max-w-xs">
          <img src={value} alt="" className="w-full h-32 object-cover rounded-lg border border-border" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent/10 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste image URL"
          className="flex-1 px-4 py-2 bg-input border border-border rounded-lg text-sm"
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
