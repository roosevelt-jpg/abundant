import { en, ar, type TranslationKey } from './en-ar';
import { EXTRA_LOCALES } from './extra';

/** Full catalogs — languages without a full map fall back to English per key. */
export const translations: Record<string, Partial<Record<TranslationKey, string>>> = {
  en,
  ar,
  ...EXTRA_LOCALES,
};

export type { TranslationKey };
export { en, ar };

export function translate(
  language: string,
  key: string,
  defaultValue?: string
): string {
  const langMap = translations[language];
  const fromLang = langMap?.[key as TranslationKey];
  if (fromLang) return fromLang;
  const fromEn = en[key as TranslationKey];
  if (fromEn) return fromEn;
  return defaultValue ?? key;
}
