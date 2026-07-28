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
import { AdminPermission } from '@/lib/types';

type MenuItem = {
  icon: typeof Home;
  label: string;
  href: string;
  permission: AdminPermission;
};

export const AdminSidebar = () => {
  const { userData, currentUser } = useAuth();
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
    { icon: Home, label: 'Dashboard', href: '/admin/dashboard', permission: 'dashboard' },
    { icon: Users, label: 'Members', href: '/admin/members', permission: 'members' },
    { icon: Calendar, label: 'Events', href: '/admin/events', permission: 'events' },
    { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials', permission: 'testimonials' },
    { icon: CreditCard, label: 'Membership Plans', href: '/admin/billing', permission: 'billing' },
    { icon: Layers, label: 'Tiers & Taxonomies', href: '/admin/membership-tiers', permission: 'billing' },
    { icon: ClipboardList, label: 'Applications', href: '/admin/applications', permission: 'applications' },
    { icon: FileText, label: 'Pages', href: '/admin/pages', permission: 'pages' },
    { icon: Info, label: 'About Page', href: '/admin/about', permission: 'about' },
    { icon: FormInput, label: 'Forms', href: '/admin/forms', permission: 'forms' },
    { icon: Image, label: 'Hero Slider', href: '/admin/settings?tab=hero', permission: 'hero' },
    { icon: Handshake, label: 'Partners', href: '/admin/settings?tab=homepage#partners', permission: 'settings' },
    { icon: HelpCircle, label: 'FAQ', href: '/admin/faq', permission: 'faq' },
    { icon: BookOpen, label: 'Resources', href: '/admin/resources', permission: 'resources' },
    { icon: Inbox, label: 'Resource Submissions', href: '/admin/resource-submissions', permission: 'resources' },
    { icon: Briefcase, label: 'Careers', href: '/admin/careers', permission: 'careers' },
    { icon: Newspaper, label: 'Press', href: '/admin/press', permission: 'press' },
    { icon: Scale, label: 'Legal', href: '/admin/legal', permission: 'legal' },
    { icon: Mail, label: 'Contact Submissions', href: '/admin/contact', permission: 'contact' },
    { icon: Bot, label: 'Chatbot', href: '/admin/chatbot', permission: 'chatbot' },
    { icon: UserPlus, label: 'Invite Admins', href: '/admin/invites', permission: 'invites' },
    { icon: Settings, label: 'Settings', href: '/admin/settings', permission: 'settings' },
    { icon: Server, label: 'Hosting', href: '/admin/hosting', permission: 'hosting' },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (item.permission === 'invites') {
      return canManageInvites(userData?.role, currentUser?.email);
    }
    return hasPermission(userData, item.permission);
  });

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'} app-sidebar border-r transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-30`}
    >
      <div className={`${isCollapsed ? 'p-2' : 'px-2 py-2'} border-b app-sidebar-divider`}>
        <Link
          href="/admin/dashboard"
          className="block w-full leading-none"
          aria-label="Abundant Global Club"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isCollapsed ? '/logo-text.png' : '/logo-text-sidebar.png'}
            alt="Abundant Global Club"
            className={
              isCollapsed
                ? 'block h-10 w-10 object-contain object-center mx-auto mix-blend-lighten'
                : 'block w-full h-auto object-contain object-left mix-blend-lighten'
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
              {!isCollapsed && <span>{item.label}</span>}
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
