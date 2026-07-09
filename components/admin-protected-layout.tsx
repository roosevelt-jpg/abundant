'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { canAccessAdmin } from '@/lib/auth-utils';

export function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
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

    setIsAuthorized(true);
  }, [currentUser, userData, loading, router]);

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
