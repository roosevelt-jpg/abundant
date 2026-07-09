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
} from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { canManageInvites, hasPermission } from '@/lib/auth-utils';
import { useAuth } from '@/context/AuthContext';
import { AdminPermission } from '@/lib/types';
import { SiteLogo } from '@/components/site-logo';

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
    if (href === '/admin/settings?tab=hero') {
      return pathname === '/admin/settings' && searchParams.get('tab') === 'hero';
    }
    if (href === '/admin/settings') {
      return pathname === '/admin/settings' && searchParams.get('tab') !== 'hero';
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
    { icon: FileText, label: 'Pages', href: '/admin/pages', permission: 'pages' },
    { icon: Info, label: 'About Page', href: '/admin/about', permission: 'about' },
    { icon: FormInput, label: 'Forms', href: '/admin/forms', permission: 'forms' },
    { icon: Image, label: 'Hero Slider', href: '/admin/settings?tab=hero', permission: 'hero' },
    { icon: HelpCircle, label: 'FAQ', href: '/admin/faq', permission: 'faq' },
    { icon: Mail, label: 'Contact Submissions', href: '/admin/contact', permission: 'contact' },
    { icon: Bot, label: 'Chatbot', href: '/admin/chatbot', permission: 'chatbot' },
    { icon: UserPlus, label: 'Invite Admins', href: '/admin/invites', permission: 'invites' },
    { icon: Settings, label: 'Settings', href: '/admin/settings', permission: 'settings' },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (item.permission === 'invites') {
      return canManageInvites(userData?.role, currentUser?.email);
    }
    return hasPermission(userData, item.permission);
  });

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-card border-r border-border transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-30`}
    >
      <div className="p-4 sm:p-6 border-b border-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2 min-w-0">
          <SiteLogo
            variant="header"
            className={`object-contain object-left ${isCollapsed ? 'h-8' : 'h-10'} w-auto max-w-full`}
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

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-4 border-t border-border hover:bg-accent/5 transition-colors"
      >
        <span className="text-xs text-muted-foreground">{isCollapsed ? '→' : '←'}</span>
      </button>
    </aside>
  );
};
