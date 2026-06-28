'use client';

import Link from 'next/link';
import { Settings, Users, FileText, Calendar, MessageSquare, Home, Image, Zap, Plug } from 'lucide-react';
import { useState } from 'react';

export const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Members', href: '/admin/members' },
    { icon: Calendar, label: 'Events', href: '/admin/events' },
    { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials' },
    { icon: Image, label: 'Hero Slider', href: '/admin/hero-slider' },
    { icon: Zap, label: 'Membership Plans', href: '/admin/membership' },
    { icon: Plug, label: 'Integrations', href: '/admin/integrations' },
    { icon: FileText, label: 'Pages', href: '/admin/pages' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-card border-r border-border transition-all duration-300 flex flex-col h-screen fixed left-0 top-0`}>
      <div className="p-6 border-b border-border">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-sm">A</span>
          </div>
          {!isCollapsed && <span className="font-heading font-bold text-accent">ADMIN</span>}
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        {/* Controls moved to header - removed duplicates */}
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
