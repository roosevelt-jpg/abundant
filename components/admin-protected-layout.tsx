'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { canAccessAdmin, hasPermission } from '@/lib/auth-utils';
import { getPermissionForPath, ROUTE_PERMISSIONS } from '@/lib/permissions';

function getFirstAllowedAdminPath(
  user: { role: import('@/lib/types').UserRole; permissions?: import('@/lib/types').AdminPermission[] } | null
): string {
  if (!user) return '/';
  for (const [path, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (hasPermission(user, permission)) return path;
  }
  return '/';
}

export function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const pathWithQuery = useMemo(() => {
    if (pathname === '/admin/settings' && tab === 'hero') {
      return `${pathname}?tab=hero`;
    }
    return pathname;
  }, [pathname, tab]);

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirect}`);
      setIsAuthorized(false);
      return;
    }

    const isAdmin =
      currentUser.email === 'admin@abundantglobalclub.com' || canAccessAdmin(userData);

    if (!isAdmin) {
      router.replace('/');
      setIsAuthorized(false);
      return;
    }

    const requiredPermission = getPermissionForPath(pathWithQuery);
    if (requiredPermission && userData && !hasPermission(userData, requiredPermission)) {
      const fallback = getFirstAllowedAdminPath(userData);
      if (fallback !== pathname) {
        router.replace(fallback);
      }
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
  }, [currentUser, userData, loading, router, pathname, pathWithQuery]);

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
