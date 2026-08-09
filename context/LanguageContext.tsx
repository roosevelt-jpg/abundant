'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { isRtlLanguage } from '@/lib/languages';
import { translate, translations as catalog } from '@/lib/i18n';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, defaultValue?: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') || 'en';
    setLanguageState(saved);
    document.documentElement.lang = saved;
    document.documentElement.dir = isRtlLanguage(saved) ? 'rtl' : 'ltr';
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
  }, []);

  const t = useCallback(
    (key: string, defaultValue?: string) => translate(language, key, defaultValue),
    [language]
  );

  const isRtl = isRtlLanguage(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

/** @deprecated Prefer importing from `@/lib/i18n` */
export const translations = catalog;

export { LanguageContext };
