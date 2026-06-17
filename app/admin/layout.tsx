'use client';

import { AdminProtectedLayout } from '@/components/admin-protected-layout';
import { AdminSidebar } from '@/components/admin-sidebar';
import { ReactNode, Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminProtectedLayout>
      <div className="flex h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-auto ml-64">
          <div className="p-8">
            <Suspense fallback={<div className="text-muted-foreground">Loading dashboard...</div>}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </AdminProtectedLayout>
  );
}
