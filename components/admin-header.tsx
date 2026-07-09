'use client';

import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';

export const AdminHeader = () => {
  const { currentUser, userData, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-card border-b border-border">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-8 py-4">
        <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Admin Dashboard</h1>

        <p className="hidden sm:block text-sm text-muted-foreground text-center whitespace-nowrap">
          Welcome back, <span className="font-medium text-foreground">{userData?.displayName || 'Admin'}</span>
        </p>

        <div className="flex items-center justify-end gap-2 sm:gap-4">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="font-mono text-sm font-semibold text-accent leading-tight">{currentTime}</span>
            <span className="text-xs text-muted-foreground leading-tight">{currentDate}</span>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
              aria-label="Profile menu"
              aria-expanded={menuOpen}
            >
              <User className="w-5 h-5" />
              <ChevronDown className="w-4 h-4 hidden sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                {currentUser?.email && (
                  <p className="px-4 py-2 text-xs text-muted-foreground border-b border-border truncate">
                    {currentUser.email}
                  </p>
                )}
                <Link
                  href="/admin/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                >
                  <User className="w-4 h-4" /> View Profile
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" /> {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </div>

          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};
