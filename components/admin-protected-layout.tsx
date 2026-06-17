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

  useEffect(() => {
    if (loading) {
      return; // Wait for auth to load
    }

    // Auth loading is complete, check if user is authenticated and authorized
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    const isAdmin = 
      currentUser.email === 'admin@abundantglobalclub.com' || 
      userData?.role === 'admin';

    if (!isAdmin) {
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, [currentUser, userData, loading, router]);

  // Show loading state while authentication is being checked
  if (loading) {
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
