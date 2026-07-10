'use client';

import { useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';

type StoredSecretFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  stored?: boolean;
  preview?: string;
  multiline?: boolean;
};

export function StoredSecretField({
  label,
  value,
  onChange,
  stored = false,
  preview,
  multiline = false,
}: StoredSecretFieldProps) {
  const [replacing, setReplacing] = useState(false);
  const showSaved = stored && !value.trim() && !replacing;
  const inputCls =
    'w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm';

  if (showSaved) {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">{label}</label>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">Saved securely</p>
            <p className="text-xs font-mono text-muted-foreground truncate">{preview || '••••••••'}</p>
          </div>
          <button
            type="button"
            onClick={() => setReplacing(true)}
            className="flex items-center gap-1 text-xs font-medium text-accent hover:underline flex-shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Replace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-medium">{label}</label>
        {stored && !value.trim() && (
          <button
            type="button"
            onClick={() => setReplacing(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
          rows={4}
          placeholder={stored ? 'Enter new value to replace stored credential' : undefined}
          autoFocus={replacing}
        />
      ) : (
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
          placeholder={stored ? 'Enter new value to replace stored credential' : undefined}
          autoFocus={replacing}
        />
      )}
    </div>
  );
}
