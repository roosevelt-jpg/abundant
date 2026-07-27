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

/**
 * True when the platform is in open/free membership mode.
 * Until admin turns on paid plans, everyone gets free access.
 */
export function isMembershipOpenAccess(paidPlansEnabled?: boolean | null): boolean {
  if (paidPlansEnabled !== true) return true;
  return isWithinFreePeriod();
}

export const SETTINGS_DOC_ID = 'main';

/** Primary platform owner — always super admin */
export const PRIMARY_ADMIN_EMAIL = 'admin@abundantglobalclub.com';

/** Hardcoded footer credit — not editable in admin */
export const FOOTER_CREDIT_NAME = 'FLYN.AI';
export const FOOTER_CREDIT_URL = 'https://myflynai.com/';

export const FOOTER_COLUMNS = ['platform', 'company', 'connect'] as const;
export type FooterColumn = (typeof FOOTER_COLUMNS)[number];

export const NAV_MENUS = ['home', 'about', 'events', 'membership', 'contact'] as const;
export type NavMenu = (typeof NAV_MENUS)[number];
