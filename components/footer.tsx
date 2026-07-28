'use client';

import Link from 'next/link';
import { SiteLogo } from './site-logo';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';
import { Page, FooterPlacement } from '@/lib/types';
import { SocialLinks } from './social-links';
import { useEffect, useState } from 'react';
import { FOOTER_CREDIT_NAME, FOOTER_CREDIT_URL } from '@/lib/constants';

const COLUMN_LABELS: Record<FooterPlacement, string> = {
  platform: 'Platform',
  company: 'Company',
  connect: 'Connect',
  none: '',
};

const DEFAULT_LINKS: Record<FooterPlacement, { href: string; label: string }[]> = {
  platform: [
    { href: '/membership', label: 'Membership' },
    { href: '/events', label: 'Events' },
    { href: '/resources', label: 'Resources' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/careers', label: 'Careers' },
    { href: '/press', label: 'Press' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
  connect: [],
  none: [],
};

export const Footer = () => {
  const { settings } = useSettings();
  const { t } = useLanguage();
  const [cmsPages, setCmsPages] = useState<Page[]>([]);

  useEffect(() => {
    fetch('/api/public/pages')
      .then((r) => r.json())
      .then(setCmsPages)
      .catch(() => setCmsPages([]));
  }, []);

  const getColumnLinks = (column: FooterPlacement) => {
    const cms = cmsPages
      .filter((p) => p.footerPlacement === column)
      .map((p) => ({ href: `/${p.slug}`, label: p.title }));
    const merged = [...DEFAULT_LINKS[column], ...cms];
    const seen = new Set<string>();
    return merged.filter((link) => {
      if (seen.has(link.href)) return false;
      seen.add(link.href);
      return true;
    });
  };

  return (
    <footer className="footer-bg border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-center sm:text-left">
          <div className="sm:col-span-2 md:col-span-1">
            <SiteLogo
              variant="footer"
              className="h-16 sm:h-20 md:h-24 w-auto max-w-[280px] sm:max-w-[320px] mb-4 mx-auto sm:mx-0 object-contain object-left"
            />
            <p className="text-sm text-gray-300">
              {settings?.branding?.footerTagline || settings?.description || 'A global network of success'}
            </p>
          </div>

          {(['platform', 'company', 'connect'] as FooterPlacement[]).map((col) => (
            <div key={col}>
              <h3 className="font-heading font-bold mb-4 text-[#B8973A]">{COLUMN_LABELS[col]}</h3>
              {col === 'connect' ? (
                settings ? <SocialLinks settings={settings} /> : <p className="text-sm text-gray-400">Follow us on social media</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {getColumnLinks(col).map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-gray-300 hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-400 text-center sm:text-left">
            {settings?.branding?.copyrightText ||
              t('footer.copyright', `© ${new Date().getFullYear()} Abundant Global Club. All rights reserved.`)}
            {' '}
            <a
              href={FOOTER_CREDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Made with ❤️ by {FOOTER_CREDIT_NAME}
            </a>
          </p>
          {settings?.siteHosting?.status === 'active' && (
            <span className="inline-flex items-center justify-center gap-1.5 self-center sm:self-auto text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full border border-[#B8973A]/40 text-[#D4AF87] bg-[#B8973A]/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Hosting Active
            </span>
          )}
        </div>
      </div>
    </footer>
  );
};
