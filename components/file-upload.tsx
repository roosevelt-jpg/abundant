'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, FileText } from 'lucide-react';

interface FileUploadProps {
  value?: string;
  onChange: (url: string, fileName?: string) => void;
  folder?: string;
  label?: string;
  accept?: string;
  maxBytes?: number;
  /** Public upload endpoint (no auth) or admin */
  endpoint?: '/api/public/upload' | '/api/admin/upload';
  idToken?: string | null;
  className?: string;
}

export function FileUpload({
  value,
  onChange,
  folder = 'uploads',
  label = 'Upload file',
  accept = '.pdf,.doc,.docx,image/*',
  maxBytes = 5 * 1024 * 1024,
  endpoint = '/api/public/upload',
  idToken,
  className = '',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFile = async (file: File) => {
    if (file.size > maxBytes) {
      setError(`File must be under ${Math.round(maxBytes / (1024 * 1024))}MB`);
      return;
    }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const headers: HeadersInit = {};
      if (endpoint === '/api/admin/upload' && idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }
      const res = await fetch(endpoint, { method: 'POST', headers, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setFileName(file.name);
      onChange(data.url as string, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 p-3 border border-border rounded-lg bg-card">
          <FileText className="w-4 h-4 text-accent flex-shrink-0" />
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-accent truncate flex-1">
            {fileName || 'Uploaded file'}
          </a>
          <button
            type="button"
            onClick={() => {
              onChange('');
              setFileName('');
            }}
            className="p-1 hover:bg-destructive/10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border rounded-lg text-sm hover:border-accent disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Choose file'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
