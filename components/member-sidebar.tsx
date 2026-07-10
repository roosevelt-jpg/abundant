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

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: User, label: 'My Profile', href: '/dashboard/profile' },
  { icon: Calendar, label: 'Events', href: '/events' },
  { icon: CreditCard, label: 'Membership', href: '/membership' },
  { icon: MessageSquare, label: 'Testimonials', href: '/dashboard/testimonials' },
  { icon: BookOpen, label: 'Resources', href: '/resources' },
  { icon: Bell, label: 'Notifications', href: '/dashboard#notifications' },
];

export function MemberSidebar() {
  const pathname = usePathname();
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
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-card border-r border-border transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-30 hidden md:flex`}
    >
      <div className="p-4 sm:p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <SiteLogo
            variant="admin"
            className={`object-contain object-left ${isCollapsed ? 'h-8' : 'h-9'} w-auto max-w-full`}
          />
        </Link>
        {!isCollapsed && (
          <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">Member area</p>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                active
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:bg-accent/10 hover:text-accent'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent/10 hover:text-accent"
        >
          <ExternalLink className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>View website</span>}
        </Link>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? '→ Expand' : '← Collapse'}
        </button>
      </div>
    </aside>
  );
}
