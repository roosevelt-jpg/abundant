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
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      console.log('[v0] Auth Debug:', { currentUser: currentUser?.email, userData, loading });
      setDebugInfo(`User: ${currentUser?.email}, Role: ${userData?.role}`);
      
      // Allow admin@abundantglobalclub.com to access without role check
      if (!currentUser || (currentUser.email !== 'admin@abundantglobalclub.com' && userData?.role !== 'admin')) {
        router.push('/login');
      }
    }
  }, [currentUser, userData, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block px-4 py-2 bg-card rounded-lg">
            <p className="text-muted-foreground">Loading...</p>
          </div>
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
