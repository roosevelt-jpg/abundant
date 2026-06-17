'use client';

import { useAuth } from '@/context/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';

export const AdminHeader = () => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-card border-b border-border">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">{currentUser.email}</span>
            </div>
          )}

          <ThemeToggle />
          <LanguageSwitcher />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-sm font-medium"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
