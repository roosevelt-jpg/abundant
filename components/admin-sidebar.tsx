'use client';

import Link from 'next/link';
import {
  Settings,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Home,
  CreditCard,
  Mail,
  UserPlus,
  Bot,
  Image,
  Info,
  FormInput,
  HelpCircle,
  BookOpen,
  Briefcase,
  Newspaper,
  Scale,
  ClipboardList,
  Layers,
  Handshake,
  Inbox,
  Server,
} from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { canManageInvites, hasPermission } from '@/lib/auth-utils';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AdminPermission } from '@/lib/types';

type MenuItem = {
  icon: typeof Home;
  labelKey: string;
  href: string;
  permission: AdminPermission;
};

export const AdminSidebar = () => {
  const { userData, currentUser } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isMenuItemActive = (href: string) => {
    const hrefBase = href.split('#')[0];
    if (hrefBase === '/admin/settings?tab=hero') {
      return pathname === '/admin/settings' && searchParams.get('tab') === 'hero';
    }
    if (hrefBase === '/admin/settings?tab=homepage') {
      return pathname === '/admin/settings' && searchParams.get('tab') === 'homepage';
    }
    if (href === '/admin/settings') {
      return pathname === '/admin/settings' && (!searchParams.get('tab') || searchParams.get('tab') === 'general');
    }
    const hrefPath = href.split('?')[0];
    return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  };

  const allMenuItems: MenuItem[] = [
    { icon: Home, labelKey: 'admin.nav.dashboard', href: '/admin/dashboard', permission: 'dashboard' },
    { icon: Users, labelKey: 'admin.nav.members', href: '/admin/members', permission: 'members' },
    { icon: Calendar, labelKey: 'admin.nav.events', href: '/admin/events', permission: 'events' },
    { icon: MessageSquare, labelKey: 'admin.nav.testimonials', href: '/admin/testimonials', permission: 'testimonials' },
    { icon: CreditCard, labelKey: 'admin.nav.billing', href: '/admin/billing', permission: 'billing' },
    { icon: Layers, labelKey: 'admin.nav.tiers', href: '/admin/membership-tiers', permission: 'billing' },
    { icon: ClipboardList, labelKey: 'admin.nav.applications', href: '/admin/applications', permission: 'applications' },
    { icon: FileText, labelKey: 'admin.nav.pages', href: '/admin/pages', permission: 'pages' },
    { icon: Info, labelKey: 'admin.nav.about', href: '/admin/about', permission: 'about' },
    { icon: FormInput, labelKey: 'admin.nav.forms', href: '/admin/forms', permission: 'forms' },
    { icon: Image, labelKey: 'admin.nav.hero', href: '/admin/settings?tab=hero', permission: 'hero' },
    { icon: Handshake, labelKey: 'admin.nav.partners', href: '/admin/settings?tab=homepage#partners', permission: 'settings' },
    { icon: HelpCircle, labelKey: 'admin.nav.faq', href: '/admin/faq', permission: 'faq' },
    { icon: BookOpen, labelKey: 'admin.nav.resources', href: '/admin/resources', permission: 'resources' },
    { icon: Inbox, labelKey: 'admin.nav.resourceSubmissions', href: '/admin/resource-submissions', permission: 'resources' },
    { icon: Briefcase, labelKey: 'admin.nav.careers', href: '/admin/careers', permission: 'careers' },
    { icon: Newspaper, labelKey: 'admin.nav.press', href: '/admin/press', permission: 'press' },
    { icon: Scale, labelKey: 'admin.nav.legal', href: '/admin/legal', permission: 'legal' },
    { icon: Mail, labelKey: 'admin.nav.contact', href: '/admin/contact', permission: 'contact' },
    { icon: Bot, labelKey: 'admin.nav.chatbot', href: '/admin/chatbot', permission: 'chatbot' },
    { icon: UserPlus, labelKey: 'admin.nav.invites', href: '/admin/invites', permission: 'invites' },
    { icon: Settings, labelKey: 'admin.nav.settings', href: '/admin/settings', permission: 'settings' },
    { icon: Server, labelKey: 'admin.nav.hosting', href: '/admin/hosting', permission: 'hosting' },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (item.permission === 'invites') {
      return canManageInvites(userData?.role, currentUser?.email);
    }
    return hasPermission(userData, item.permission);
  });

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'} app-sidebar border-r transition-all duration-300 flex flex-col h-screen fixed start-0 top-0 z-30`}
    >
      <div className={`${isCollapsed ? 'p-2' : 'px-4 py-2.5'} border-b app-sidebar-divider`}>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center leading-none"
          aria-label="Abundant Global Club"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isCollapsed ? '/logo-text.png' : '/logo-text-sidebar.png'}
            alt="Abundant Global Club"
            width={isCollapsed ? 20 : 110}
            height={isCollapsed ? 20 : 22}
            className={
              isCollapsed
                ? 'block h-5 w-5 object-contain object-center mix-blend-lighten'
                : 'block h-[22px] w-[110px] max-h-[22px] max-w-[110px] object-contain object-left mix-blend-lighten'
            }
          />
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isMenuItemActive(item.href);
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

      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-4 border-t app-sidebar-divider app-sidebar-link w-full text-left"
      >
        <span className="text-xs text-white/70">{isCollapsed ? '→' : '←'}</span>
      </button>
    </aside>
  );
};
