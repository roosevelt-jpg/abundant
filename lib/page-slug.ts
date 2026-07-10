/** Reserved hard routes that CMS pages must not claim. */
export const RESERVED_PAGE_SLUGS = new Set([
  'admin',
  'api',
  'dashboard',
  'login',
  'signup',
  'events',
  'about',
  'contact',
  'membership',
  'pricing',
  'faq',
  'join-admin',
  'resources',
  'careers',
  'press',
  'privacy',
  'terms',
  'apply',
  'onboarding',
  'home',
]);

/** True for legacy auto IDs like page-1783675824364 */
export function isPlaceholderPageSlug(slug: string | undefined | null): boolean {
  if (!slug) return true;
  return /^page-\d+$/i.test(slug.trim()) || /^page-[a-z0-9]{4,12}$/i.test(slug.trim());
}

export function slugifyPageTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return base || 'page';
}

export function ensureUniquePageSlug(base: string, existing: string[]): string {
  let slug = slugifyPageTitle(base) || 'page';
  if (RESERVED_PAGE_SLUGS.has(slug)) {
    slug = `${slug}-page`;
  }
  const taken = new Set(existing.map((s) => s.toLowerCase()));
  if (!taken.has(slug)) return slug;
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}

/** Prefer an explicit slug; otherwise derive from title. Always unique + non-reserved. */
export function resolvePageSlug(options: {
  title: string;
  slug?: string;
  existingSlugs: string[];
  forceFromTitle?: boolean;
}): string {
  const { title, existingSlugs, forceFromTitle } = options;
  const raw = (options.slug || '').trim();
  const fromTitle = forceFromTitle || !raw || isPlaceholderPageSlug(raw);
  const base = fromTitle ? slugifyPageTitle(title) : slugifyPageTitle(raw);
  return ensureUniquePageSlug(base, existingSlugs);
}
