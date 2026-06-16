'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, defaultValue?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<string, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.membership': 'Membership',
    'nav.events': 'Events',
    'nav.opportunities': 'Opportunities',
    'nav.contact': 'Contact',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'hero.title': 'Welcome to Abundant Global Club',
    'hero.subtitle': 'A Global Network of Success',
    'footer.copyright': '© 2024 Abundant Global Club. All rights reserved.',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.about': 'حول',
    'nav.membership': 'العضوية',
    'nav.events': 'الأحداث',
    'nav.opportunities': 'الفرص',
    'nav.contact': 'اتصل بنا',
    'nav.dashboard': 'لوحة التحكم',
    'nav.logout': 'تسجيل الخروج',
    'nav.login': 'تسجيل الدخول',
    'hero.title': 'مرحبا بك في نادي أبوندانت العالمي',
    'hero.subtitle': 'شبكة عالمية للنجاح',
    'footer.copyright': '© 2024 نادي أبوندانت العالمي. جميع الحقوق محفوظة.',
  },
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('language') || 'en';
    setLanguageState(saved);
    document.documentElement.lang = saved;
    document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string, defaultValue: string = key) => {
    return translations[language]?.[key] || translations['en']?.[key] || defaultValue;
  };

  if (!mounted) return children;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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

export { translations };
