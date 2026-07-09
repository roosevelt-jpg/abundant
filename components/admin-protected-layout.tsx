'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { canAccessAdmin, hasPermission } from '@/lib/auth-utils';
import { getPermissionForPath } from '@/lib/permissions';

export function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      router.push('/login');
      setIsAuthorized(false);
      return;
    }

    const isAdmin =
      currentUser.email === 'admin@abundantglobalclub.com' || canAccessAdmin(userData);

    if (!isAdmin) {
      router.push('/');
      setIsAuthorized(false);
      return;
    }

    const tab = searchParams.get('tab');
    const pathWithQuery =
      pathname === '/admin/settings' && tab === 'hero'
        ? `${pathname}?tab=hero`
        : pathname;

    const requiredPermission = getPermissionForPath(pathWithQuery);
    if (requiredPermission && userData && !hasPermission(userData, requiredPermission)) {
      router.push('/admin/dashboard');
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
  }, [currentUser, userData, loading, router, pathname, searchParams]);

  if (loading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return <>{children}</>;
}
