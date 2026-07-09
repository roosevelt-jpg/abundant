'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { useSettings } from '@/hooks/useSettings';
import { Page } from '@/lib/types';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

const STATIC_NAV = [
  { href: '/', labelKey: 'nav.home', label: 'Home', menu: 'home' },
  { href: '/about', labelKey: 'nav.about', label: 'About', menu: 'about' },
  { href: '/events', labelKey: 'nav.events', label: 'Events', menu: 'events' },
  { href: '/membership', labelKey: 'nav.membership', label: 'Membership', menu: 'membership' },
  { href: '/contact', labelKey: 'nav.contact', label: 'Contact', menu: 'contact' },
];

export const Header = () => {
  const { currentUser, logout, userData } = useAuth();
  const { t } = useLanguage();
  const { settings } = useSettings();
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

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link href={href} className="text-sm hover:text-accent transition-colors" onClick={() => setMobileOpen(false)}>
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <Image src="/logo-text.png" alt={settings?.siteName || 'Abundant Global Club'} width={120} height={40} className="h-10 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {STATIC_NAV.map((item) => {
            const children = dropdownPages(item.menu);
            if (children.length > 0) {
              return (
                <div key={item.href} className="relative group">
                  <button className="text-sm hover:text-accent transition-colors flex items-center gap-1">
                    {t(item.labelKey, item.label)} <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link href={item.href} className="block px-4 py-2 text-sm hover:bg-accent/10">{t(item.labelKey, item.label)}</Link>
                    {children.map((p) => (
                      <Link key={p.id} href={`/${p.slug}`} className="block px-4 py-2 text-sm hover:bg-accent/10">{p.title}</Link>
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

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          {currentUser ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link href={userData?.role === 'admin' || userData?.role === 'super_admin' ? '/admin/dashboard' : '/dashboard'} className="text-sm font-medium text-accent">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground">Logout</button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-accent">Login</Link>
              <Link href="/signup" className="text-sm font-medium bg-accent text-accent-foreground px-4 py-2 rounded-lg">Join</Link>
            </div>
          )}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-border px-4 py-4 space-y-3 bg-card">
          {STATIC_NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={t(item.labelKey, item.label)} />
          ))}
          {topLevelCms.map((p) => (
            <NavLink key={p.id} href={`/${p.slug}`} label={p.title} />
          ))}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          {currentUser ? (
            <>
              <Link href="/dashboard" className="block text-sm text-accent" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="text-sm text-muted-foreground">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="block text-sm text-accent" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link href="/signup" className="block text-sm bg-accent text-accent-foreground px-4 py-2 rounded-lg text-center" onClick={() => setMobileOpen(false)}>Join</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
