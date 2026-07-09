'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { Page } from '@/lib/types';
import { SiteLogo } from './site-logo';
import { useEffect, useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

const STATIC_NAV = [
  { href: '/', labelKey: 'nav.home', label: 'Home', menu: 'home' },
  { href: '/about', labelKey: 'nav.about', label: 'About', menu: 'about' },
  { href: '/events', labelKey: 'nav.events', label: 'Events', menu: 'events' },
  { href: '/membership', labelKey: 'nav.membership', label: 'Membership', menu: 'membership' },
  { href: '/contact', labelKey: 'nav.contact', label: 'Contact', menu: 'contact' },
  { href: '/faq', labelKey: 'nav.faq', label: 'FAQ', menu: 'faq' },
];

export const Header = () => {
  const { currentUser, logout, userData } = useAuth();
  const { t } = useLanguage();
  const [cmsPages, setCmsPages] = useState<Page[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/pages')
      .then((r) => r.json())
      .then(setCmsPages)
      .catch(() => setCmsPages([]));
  }, []);

  const topLevelCms = cmsPages.filter((p) => p.navPlacement === 'top-level');
  const dropdownPages = (menu: string) =>
    cmsPages.filter((p) => p.navPlacement === menu || (p.navParent === menu && p.navPlacement !== 'top-level' && p.navPlacement !== 'none'));

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navLinkCls = 'text-sm text-white/90 hover:text-[#D4AF87] transition-colors';
  const accentLinkCls = 'text-sm font-medium text-[#D4AF87] hover:text-white transition-colors';

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link href={href} className={navLinkCls} onClick={() => setMobileOpen(false)}>
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 header-gradient border-b border-white/10 shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <SiteLogo variant="header" className="h-10 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {STATIC_NAV.map((item) => {
            const children = dropdownPages(item.menu);
            if (children.length > 0) {
              return (
                <div key={item.href} className="relative group">
                  <button className={`${navLinkCls} flex items-center gap-1`}>
                    {t(item.labelKey, item.label)} <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 bg-[#0F1B2E]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl py-2 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link href={item.href} className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-[#D4AF87]">{t(item.labelKey, item.label)}</Link>
                    {children.map((p) => (
                      <Link key={p.id} href={`/${p.slug}`} className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-[#D4AF87]">{p.title}</Link>
                    ))}
                  </div>
                </div>
              );
            }
            return <NavLink key={item.href} href={item.href} label={t(item.labelKey, item.label)} />;
          })}
          {topLevelCms.map((p) => (
            <NavLink key={p.id} href={`/${p.slug}`} label={p.title} />
          ))}
        </div>

        <div className="flex items-center gap-3 text-white">
          <div className="hidden sm:flex items-center gap-2 [&_button]:text-white/90 [&_button]:hover:text-[#D4AF87]">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          {currentUser ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link href={userData?.role === 'admin' || userData?.role === 'super_admin' ? '/admin/dashboard' : '/dashboard'} className={accentLinkCls}>
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-sm text-white/70 hover:text-white transition-colors">Logout</button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link href="/login" className={accentLinkCls}>Login</Link>
              <Link href="/signup" className="text-sm font-medium btn-gradient px-4 py-2 rounded-lg">Join</Link>
            </div>
          )}
          <button className="md:hidden p-2 text-white" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-4 space-y-3 bg-[#0F1B2E]/95 backdrop-blur-md">
          {STATIC_NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={t(item.labelKey, item.label)} />
          ))}
          {topLevelCms.map((p) => (
            <NavLink key={p.id} href={`/${p.slug}`} label={p.title} />
          ))}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10 [&_button]:text-white/90">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          {currentUser ? (
            <>
              <Link href="/dashboard" className={`block ${accentLinkCls}`} onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="text-sm text-white/70 hover:text-white">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className={`block ${accentLinkCls}`} onClick={() => setMobileOpen(false)}>Login</Link>
              <Link href="/signup" className="block text-sm btn-gradient px-4 py-2 rounded-lg text-center" onClick={() => setMobileOpen(false)}>Join</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
