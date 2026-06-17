'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin dashboard
    router.push('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    </div>
  );
}

