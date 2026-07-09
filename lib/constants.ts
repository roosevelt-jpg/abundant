/** Last day of the annual free-access window (inclusive). */
export const FREE_ACCESS_END_MONTH = 7; // August (0-indexed)
export const FREE_ACCESS_END_DAY = 31;

export function getFreeAccessEndDate(year?: number): Date {
  const y = year ?? new Date().getFullYear();
  return new Date(y, FREE_ACCESS_END_MONTH, FREE_ACCESS_END_DAY, 23, 59, 59, 999);
}

export function isWithinFreePeriod(now: Date = new Date()): boolean {
  return now <= getFreeAccessEndDate(now.getFullYear());
}

export const SETTINGS_DOC_ID = 'main';

export const FOOTER_COLUMNS = ['platform', 'company', 'connect'] as const;
export type FooterColumn = (typeof FOOTER_COLUMNS)[number];

export const NAV_MENUS = ['home', 'about', 'events', 'membership', 'contact'] as const;
export type NavMenu = (typeof NAV_MENUS)[number];
