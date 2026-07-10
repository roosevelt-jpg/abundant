'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { isRtlLanguage } from '@/lib/languages';

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
    'nav.join': 'Join',
    'hero.title': 'Welcome to Abundant Global Club',
    'hero.subtitle': 'A Global Network of Success',
    'footer.copyright': '© 2026 Abundant Global Club. All rights reserved.',
    'about.title': 'About Abundant Global Club',
    'about.subtitle': 'Cultivating excellence through global community and shared prosperity',
    'about.values': 'Core Values',
    'about.team': 'Our Team',
    'events.title': 'Events',
    'events.subtitle': 'Join us for exclusive networking and learning opportunities',
    'events.list': 'List',
    'events.calendar': 'Calendar',
    'events.upcoming': 'Upcoming Events',
    'events.none': 'No events on this date',
    'events.empty': 'No upcoming events',
    'events.suggest': 'Suggest an event →',
    'membership.title': 'Membership',
    'membership.subtitle': 'Choose the tier that aligns with your ambitions',
    'membership.free': 'Free full access until August 31!',
    'membership.popular': 'Most Popular',
    'membership.subscribe': 'Subscribe',
    'membership.included': 'Included Free',
    'membership.noPlans': 'Plans coming soon',
    'contact.title': 'Contact Us',
    'contact.subtitle': "Have a question? We'd love to hear from you.",
    'contact.getInTouch': 'Get in Touch',
    'contact.sendMessage': 'Send us a Message',
    'contact.followUs': 'Follow Us',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.retry': 'Retry',
    'dashboard.welcome': 'Welcome',
    'dashboard.upgrade': 'Your free access period has ended',
    'dashboard.upgradeDesc': 'Upgrade to continue enjoying full member benefits.',
    'dashboard.viewPlans': 'View Plans',
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
    'nav.join': 'انضم',
    'hero.title': 'مرحبا بك في نادي أبوندانت العالمي',
    'hero.subtitle': 'شبكة عالمية للنجاح',
    'footer.copyright': '© 2026 نادي أبوندانت العالمي. جميع الحقوق محفوظة.',
    'about.title': 'حول نادي أبوندانت العالمي',
    'about.subtitle': 'تنمية التميز من خلال المجتمع العالمي والازدهار المشترك',
    'about.values': 'القيم الأساسية',
    'about.team': 'فريقنا',
    'events.title': 'الأحداث',
    'events.subtitle': 'انضم إلينا لفرص التواصل والتعلم الحصرية',
    'events.list': 'قائمة',
    'events.calendar': 'التقويم',
    'events.upcoming': 'الأحداث القادمة',
    'events.none': 'لا توجد أحداث في هذا التاريخ',
    'events.empty': 'لا توجد أحداث قادمة',
    'events.suggest': 'اقترح حدثًا ←',
    'membership.title': 'العضوية',
    'membership.subtitle': 'اختر المستوى الذي يتوافق مع طموحاتك',
    'membership.free': 'وصول مجاني كامل حتى 31 أغسطس!',
    'membership.popular': 'الأكثر شعبية',
    'membership.subscribe': 'اشترك',
    'membership.included': 'مشمول مجانًا',
    'membership.noPlans': 'الخطط قريبًا',
    'contact.title': 'اتصل بنا',
    'contact.subtitle': 'لديك سؤال؟ يسعدنا سماعك.',
    'contact.getInTouch': 'تواصل معنا',
    'contact.sendMessage': 'أرسل لنا رسالة',
    'contact.followUs': 'تابعنا',
    'common.loading': 'جاري التحميل...',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.retry': 'إعادة المحاولة',
    'dashboard.welcome': 'مرحبًا',
    'dashboard.upgrade': 'انتهت فترة الوصول المجاني',
    'dashboard.upgradeDesc': 'قم بالترقية للاستمرار في الاستفادة من مزايا العضوية.',
    'dashboard.viewPlans': 'عرض الخطط',
  },
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') || 'en';
    setLanguageState(saved);
    document.documentElement.lang = saved;
    document.documentElement.dir = isRtlLanguage(saved) ? 'rtl' : 'ltr';
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
  };

  const t = (key: string, defaultValue: string = key) => {
    return translations[language]?.[key] || translations['en']?.[key] || defaultValue;
  };

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

export { translations, LanguageContext };
