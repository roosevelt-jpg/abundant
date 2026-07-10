export type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
};

/** All languages available in the site language switcher. */
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', rtl: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true },
];

export const DEFAULT_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

const languageByCode = new Map(SUPPORTED_LANGUAGES.map((l) => [l.code, l]));

export function getLanguageOption(code: string): LanguageOption | undefined {
  return languageByCode.get(code);
}

export function getLanguagesForSwitcher(enabledCodes?: string[]): LanguageOption[] {
  if (!enabledCodes?.length) return SUPPORTED_LANGUAGES;
  const enabled = new Set(enabledCodes);
  const filtered = SUPPORTED_LANGUAGES.filter((l) => enabled.has(l.code));
  return filtered.length > 0 ? filtered : SUPPORTED_LANGUAGES;
}

export function isRtlLanguage(code: string): boolean {
  return getLanguageOption(code)?.rtl === true;
}
