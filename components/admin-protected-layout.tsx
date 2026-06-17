'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkTimeout, setCheckTimeout] = useState(false);

  // Set a 5-second timeout for auth check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('[v0] Auth check timeout - forcing redirect to login');
      setCheckTimeout(true);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // If timeout occurred, redirect to login
    if (checkTimeout) {
      router.push('/login');
      return;
    }

    // Still loading auth
    if (loading) {
      return;
    }

    // Auth loading is complete, check if user is authenticated and authorized
    if (!currentUser) {
      console.log('[v0] No current user - redirecting to login');
      router.push('/login');
      return;
    }

    // Check if user is admin
    const isAdmin = 
      currentUser.email === 'admin@abundantglobalclub.com' || 
      userData?.role === 'admin';

    if (!isAdmin) {
      console.log('[v0] User is not admin - redirecting home');
      router.push('/');
      return;
    }

    console.log('[v0] Admin user authorized');
    setIsAuthorized(true);
  }, [currentUser, userData, loading, router, checkTimeout]);

  // Show loading state while authentication is being checked
  if (loading && !checkTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authorized, don't render dashboard
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
