'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import Image from 'next/image';

export const Header = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-heading text-lg font-bold text-accent">ABUNDANT</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/membership" className="text-sm hover:text-accent transition-colors">
            Membership
          </Link>
          <Link href="/events" className="text-sm hover:text-accent transition-colors">
            Events
          </Link>
          <Link href="/about" className="text-sm hover:text-accent transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-sm hover:text-accent transition-colors">
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          
          {currentUser ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
                Login
              </Link>
              <Link href="/signup" className="text-sm font-medium bg-accent text-accent-foreground px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors">
                Join
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
