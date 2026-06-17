'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Allow admin@abundantglobalclub.com or users with admin role
      const isAdmin = currentUser?.email === 'admin@abundantglobalclub.com' || userData?.role === 'admin';
      
      if (!currentUser || !isAdmin) {
        router.push('/login');
      }
    }
  }, [currentUser, userData, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Allow admin@abundantglobalclub.com or users with admin role
  if (currentUser.email !== 'admin@abundantglobalclub.com' && userData?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
