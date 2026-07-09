'use client';

import { useState, useMemo } from 'react';
import { COUNTRIES } from '@/lib/countries';
import { Globe } from 'lucide-react';

interface CountrySelectProps {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export function CountrySelect({
  value,
  onChange,
  label = 'Country',
  required = false,
  placeholder = 'Select country...',
}: CountrySelectProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const selected = COUNTRIES.find((c) => c.code === value);

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2">
        {label}
        {required && ' *'}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2 bg-input border border-border rounded-lg text-left text-sm"
      >
        <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className={selected ? '' : 'text-muted-foreground'}>
          {selected ? `${selected.name} (${selected.code})` : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-3 py-1.5 bg-input border border-border rounded text-sm"
              autoFocus
            />
          </div>
          <ul className="overflow-y-auto max-h-48">
            {filtered.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-accent/10 ${
                    value === c.code ? 'bg-accent/10 text-accent' : ''
                  }`}
                >
                  {c.name} <span className="text-muted-foreground">({c.code})</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground">No countries found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
