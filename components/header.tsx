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
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/pages')
      .then((r) => r.json())
      .then(setCmsPages)
      .catch(() => setCmsPages([]));
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

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

  const navLinkCls = 'text-sm text-white/90 hover:text-[#D4AF87] transition-colors block py-2';
  const accentLinkCls = 'text-sm font-medium text-[#D4AF87] hover:text-white transition-colors';

  const NavLink = ({ href, label, indent = false }: { href: string; label: string; indent?: boolean }) => (
    <Link
      href={href}
      className={`${navLinkCls} ${indent ? 'pl-4 text-white/80' : ''} break-words`}
      onClick={() => setMobileOpen(false)}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#001F3F] from-30% via-[#002850] to-[#B8973A] border-b border-[#B8973A]/30 shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex-shrink-0 min-w-0">
          <SiteLogo variant="header" className="h-8 sm:h-10 w-auto max-w-[140px] sm:max-w-none object-contain object-left" />
        </Link>

        <div className="hidden lg:flex items-center gap-4 xl:gap-6 flex-wrap justify-end">
          {STATIC_NAV.map((item) => {
            const children = dropdownPages(item.menu);
            if (children.length > 0) {
              return (
                <div key={item.href} className="relative group">
                  <button type="button" className={`${navLinkCls.replace('block py-2', '')} flex items-center gap-1`}>
                    {t(item.labelKey, item.label)} <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 bg-[#001F3F]/95 backdrop-blur-md border border-[#B8973A]/20 rounded-lg shadow-xl py-2 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link href={item.href} className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-[#D4AF87]">{t(item.labelKey, item.label)}</Link>
                    {children.map((p) => (
                      <Link key={p.id} href={`/${p.slug}`} className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-[#D4AF87]">{p.title}</Link>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <Link key={item.href} href={item.href} className={navLinkCls.replace('block py-2', '')}>
                {t(item.labelKey, item.label)}
              </Link>
            );
          })}
          {topLevelCms.map((p) => (
            <Link key={p.id} href={`/${p.slug}`} className={`${navLinkCls.replace('block py-2', '')} max-w-[120px] truncate`} title={p.title}>
              {p.title}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-white flex-shrink-0">
          <div className="hidden md:flex items-center gap-2 [&_button]:text-white/90 [&_button]:hover:text-[#D4AF87]">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          {currentUser ? (
            <div className="hidden md:flex items-center gap-3">
              <Link href={userData?.role === 'admin' || userData?.role === 'super_admin' ? '/admin/dashboard' : '/dashboard'} className={accentLinkCls}>
                Dashboard
              </Link>
              <button type="button" onClick={handleLogout} className="text-sm text-white/70 hover:text-white transition-colors">Logout</button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className={accentLinkCls}>Login</Link>
              <Link href="/signup" className="text-sm font-medium btn-gradient px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap">Join</Link>
            </div>
          )}
          <button type="button" className="lg:hidden p-2 text-white" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 top-[57px] bg-black/40 lg:hidden z-40" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="lg:hidden relative z-50 border-t border-[#B8973A]/20 bg-[#001F3F]/98 backdrop-blur-md max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain">
            <div className="px-4 py-4 space-y-1">
              {STATIC_NAV.map((item) => {
                const children = dropdownPages(item.menu);
                if (children.length > 0) {
                  const expanded = expandedMobile === item.menu;
                  return (
                    <div key={item.href}>
                      <button
                        type="button"
                        className={`${navLinkCls} w-full flex items-center justify-between`}
                        onClick={() => setExpandedMobile(expanded ? null : item.menu)}
                      >
                        {t(item.labelKey, item.label)}
                        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded && (
                        <div className="pb-2">
                          <NavLink href={item.href} label={t(item.labelKey, item.label)} indent />
                          {children.map((p) => (
                            <NavLink key={p.id} href={`/${p.slug}`} label={p.title} indent />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return <NavLink key={item.href} href={item.href} label={t(item.labelKey, item.label)} />;
              })}
              {topLevelCms.map((p) => (
                <NavLink key={p.id} href={`/${p.slug}`} label={p.title} />
              ))}
              <div className="flex items-center gap-2 pt-3 border-t border-white/10 [&_button]:text-white/90">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
              {currentUser ? (
                <div className="pt-2 space-y-2 border-t border-white/10">
                  <Link href={userData?.role === 'admin' || userData?.role === 'super_admin' ? '/admin/dashboard' : '/dashboard'} className={`block ${accentLinkCls}`} onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <button type="button" onClick={handleLogout} className="text-sm text-white/70 hover:text-white">Logout</button>
                </div>
              ) : (
                <div className="pt-2 space-y-2 border-t border-white/10">
                  <Link href="/login" className={`block ${accentLinkCls}`} onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link href="/signup" className="block text-sm btn-gradient px-4 py-2.5 rounded-lg text-center" onClick={() => setMobileOpen(false)}>Join</Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
