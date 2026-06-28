'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Wait for auth to load
    if (loading) {
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected.current) {
      return;
    }

    // Check if user is logged in
    if (!currentUser) {
      console.log('[v0] No current user - redirecting to login');
      hasRedirected.current = true;
      setIsAuthorized(false);
      // Use startTransition to safely dispatch router action
      router.push('/login');
      return;
    }

    // Check if user is admin
    const isAdmin = 
      currentUser.email === 'admin@abundantglobalclub.com' || 
      userData?.role === 'admin';

    if (!isAdmin) {
      console.log('[v0] User is not admin - redirecting home');
      hasRedirected.current = true;
      setIsAuthorized(false);
      // Use startTransition to safely dispatch router action
      router.push('/');
      return;
    }

    console.log('[v0] Admin user authorized');
    setIsAuthorized(true);
  }, [currentUser, userData, loading, router]);

  // Show loading state while authentication is being checked
  if (loading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // If not authorized, return nothing and let the redirect take effect
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
