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
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
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
    return [...DEFAULT_LINKS[column], ...cms];
  };

  return (
    <footer className="footer-bg border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-center sm:text-left">
          <div className="sm:col-span-2 md:col-span-1">
            <SiteLogo variant="footer" className="mb-4 mx-auto sm:mx-0" />
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

        <div className="border-t border-gray-700 pt-8">
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
        </div>
      </div>
    </footer>
  );
};
