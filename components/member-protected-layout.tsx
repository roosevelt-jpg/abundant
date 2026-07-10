'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { isAdminRole } from '@/lib/auth-utils';

export function MemberProtectedLayout({ children }: { children: ReactNode }) {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      setReady(false);
      return;
    }

    if (userData && isAdminRole(userData.role)) {
      router.replace('/admin/dashboard');
      setReady(false);
      return;
    }

    // Wait briefly for userData; allow render once auth user exists
    setReady(true);
  }, [loading, currentUser, userData, router, pathname]);

  if (loading || !ready || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading member area…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
