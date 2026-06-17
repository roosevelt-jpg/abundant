'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { AboutDropdown } from './about-dropdown';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const Header = () => {
  const { currentUser, logout } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string>('/logo.png');

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists() && settingsDoc.data().logos?.header) {
          setLogoUrl(settingsDoc.data().logos.header);
        }
      } catch (error) {
        console.error('[v0] Error fetching logo:', error);
      }
    };
    fetchLogo();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 header-footer-bg border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <Image 
            src={logoUrl}
            alt="Abundant Global Club Logo"
            width={140}
            height={50}
            className="h-12 w-auto"
          />
        </Link>

        <div className="hidden md:flex items-center gap-6 text-white">
          <Link href="/" className="text-sm hover:text-accent transition-colors">
            Home
          </Link>
          <AboutDropdown />
          <Link href="/events" className="text-sm hover:text-accent transition-colors">
            Events
          </Link>
          <Link href="/membership" className="text-sm hover:text-accent transition-colors">
            Membership
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
                className="text-sm font-medium text-white hover:text-accent transition-colors"
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
