'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  User,
  Calendar,
  CreditCard,
  MessageSquare,
  Bell,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { SiteLogo } from '@/components/site-logo';
import { useLanguage } from '@/context/LanguageContext';

const menuItems = [
  { icon: Home, labelKey: 'admin.nav.dashboard', href: '/dashboard' },
  { icon: User, labelKey: 'dashboard.myProfile', href: '/dashboard/profile' },
  { icon: Calendar, labelKey: 'nav.events', href: '/events' },
  { icon: CreditCard, labelKey: 'nav.membership', href: '/membership' },
  { icon: MessageSquare, labelKey: 'admin.nav.testimonials', href: '/dashboard/testimonials' },
  { icon: BookOpen, labelKey: 'nav.resources', href: '/resources' },
  { icon: Bell, labelKey: 'dashboard.notifications', href: '/dashboard#notifications' },
];

export function MemberSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) => {
    const path = href.split('#')[0];
    if (path === '/dashboard') return pathname === '/dashboard';
    if (path.startsWith('/dashboard')) {
      return pathname === path || pathname.startsWith(`${path}/`);
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'} app-sidebar border-r transition-all duration-300 flex flex-col h-screen fixed start-0 top-0 z-30 hidden md:flex`}
    >
      <div className="p-4 sm:p-6 border-b app-sidebar-divider">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <SiteLogo
            variant="header"
            className={`object-contain object-left ${isCollapsed ? 'h-8' : 'h-9'} w-auto max-w-full`}
          />
        </Link>
        {!isCollapsed && (
          <p className="mt-2 text-[11px] uppercase tracking-wide text-white/55">{t('dashboard.memberArea', 'Member area')}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`app-sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                active ? 'app-sidebar-link-active' : ''
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t app-sidebar-divider space-y-1">
        <Link
          href="/"
          className="app-sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium"
        >
          <ExternalLink className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>{t('dashboard.viewWebsite', 'View website')}</span>}
        </Link>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="app-sidebar-link w-full text-left px-4 py-2 text-xs text-white/70 rounded-lg"
        >
          {isCollapsed ? `→ ${t('common.expand', 'Expand')}` : `← ${t('common.collapse', 'Collapse')}`}
        </button>
      </div>
    </aside>
  );
}
