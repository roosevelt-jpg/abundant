'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  LogOut,
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
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { canManageInvites } from '@/lib/auth-utils';

export const AdminSidebar = () => {
  const { logout, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Members', href: '/admin/members' },
    { icon: Calendar, label: 'Events', href: '/admin/events' },
    { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials' },
    { icon: CreditCard, label: 'Membership Plans', href: '/admin/billing' },
    { icon: FileText, label: 'Pages', href: '/admin/pages' },
    { icon: Image, label: 'Hero Slider', href: '/admin/settings?tab=hero' },
    { icon: Mail, label: 'Contact Submissions', href: '/admin/contact' },
    { icon: Bot, label: 'Chatbot', href: '/admin/chatbot' },
    ...(canManageInvites(userData?.role)
      ? [{ icon: UserPlus, label: 'Invite Admins', href: '/admin/invites' }]
      : []),
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

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
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
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

      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-sm font-medium disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && (isLoggingOut ? 'Logging out...' : 'Logout')}
        </button>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-4 border-t border-border hover:bg-accent/5 transition-colors"
      >
        <span className="text-xs text-muted-foreground">{isCollapsed ? '→' : '←'}</span>
      </button>
    </aside>
  );
};
