'use client';

import { Globe } from 'lucide-react';
import { useState, useContext, useEffect, useRef } from 'react';
import { LanguageContext } from '@/context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';

export const LanguageSwitcher = () => {
  const context = useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const languages = SUPPORTED_LANGUAGES;

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  if (!context) {
    return (
      <button className="p-2 rounded-lg hover:bg-accent/20 transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed">
        <Globe className="w-5 h-5 text-accent" />
        <span className="text-sm font-medium">EN</span>
      </button>
    );
  }

  const { language, setLanguage } = context;
  const active = languages.find((l) => l.code === language) ?? languages[0];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-accent/20 transition-colors flex items-center gap-2"
        aria-label="Language switcher"
        aria-expanded={isOpen}
      >
        <Globe className="w-5 h-5 text-accent" />
        <span className="text-sm font-medium">{active?.code.toUpperCase() ?? 'EN'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[180px] max-h-[min(360px,70dvh)] overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left hover:bg-accent/20 transition-colors flex items-center gap-2.5 ${
                language === lang.code ? 'bg-accent/20' : ''
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{lang.nativeName}</span>
                {lang.nativeName !== lang.name && (
                  <span className="text-xs text-muted-foreground truncate">{lang.name}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
