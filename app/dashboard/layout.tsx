'use client';

import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, User, Settings, Key } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, userData, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    if (!loading && currentUser && userData) {
      // Only redirect to admin if BOTH email AND role indicate admin
      const isAdmin = currentUser.email === 'admin@abundantglobalclub.com' && userData.role === 'admin';
      if (isAdmin) {
        router.push('/admin/dashboard');
      }
    }
  }, [currentUser, userData, loading, router]);

  const isProfilePage = pathname === '/dashboard/profile';
  const isCredentialsPage = pathname === '/dashboard/credentials';
  const isSettingsPage = pathname === '/dashboard/settings';

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: null, active: pathname === '/dashboard' },
    { href: '/dashboard/profile', label: 'Profile', icon: User, active: isProfilePage },
    { href: '/dashboard/credentials', label: 'Credentials', icon: Key, active: isCredentialsPage },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings, active: isSettingsPage },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('[v0] Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                {/* User Avatar */}
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center text-white font-bold">
                      {userData?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{userData?.displayName || 'Member'}</p>
                      <p className="text-xs text-muted-foreground">{currentUser?.email || 'user@example.com'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Tier:</span> <span className="capitalize text-accent">{userData?.membershipTier || 'Member'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Status:</span> <span className="capitalize">{userData?.status || 'Active'}</span>
                    </p>
                  </div>
                </div>

                {/* Menu */}
                <nav className="space-y-2 mb-6">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                          item.active
                            ? 'bg-accent text-white'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              {children}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
