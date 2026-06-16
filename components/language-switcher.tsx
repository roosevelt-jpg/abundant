'use client';

import { Globe } from 'lucide-react';
import { useState, useContext } from 'react';
import { LanguageContext } from '@/context/LanguageContext';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export const LanguageSwitcher = () => {
  const context = useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);

  // If context is not available, render a disabled version
  if (!context) {
    return (
      <button className="p-2 rounded-lg hover:bg-accent/20 transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed">
        <Globe className="w-5 h-5 text-accent" />
        <span className="text-sm font-medium">EN</span>
      </button>
    );
  }

  const { language, setLanguage } = context;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-accent/20 transition-colors flex items-center gap-2"
        aria-label="Language switcher"
      >
        <Globe className="w-5 h-5 text-accent" />
        <span className="text-sm font-medium">{language.toUpperCase()}</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[150px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-accent/20 transition-colors flex items-center gap-2 ${
                language === lang.code ? 'bg-accent/20' : ''
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
