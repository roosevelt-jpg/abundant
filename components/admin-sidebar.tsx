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
import { usePathname } from 'next/navigation';
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
  const { userData } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    ...(canManageInvites(userData?.role)
      ? [{ icon: UserPlus, label: 'Invite Admins', href: '/admin/invites', permission: 'invites' as AdminPermission }]
      : []),
    { icon: Settings, label: 'Settings', href: '/admin/settings', permission: 'settings' },
  ];

  const menuItems = allMenuItems.filter((item) => hasPermission(userData, item.permission));

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-card border-r border-border transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-30`}
    >
      <div className="p-6 border-b border-border">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-sm">A</span>
          </div>
          {!isCollapsed && <span className="font-heading font-bold text-accent">ADMIN</span>}
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hrefPath = item.href.split('?')[0];
          const active = pathname === hrefPath || pathname.startsWith(hrefPath + '/');
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
