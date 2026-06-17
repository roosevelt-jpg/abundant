'use client';

import { AdminProtectedLayout } from '@/components/admin-protected-layout';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';
import { ReactNode, Suspense } from 'react';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminProtectedLayout>
      <div className="flex h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col ml-64">
          <AdminHeader />
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              <Suspense fallback={<div className="text-muted-foreground">Loading dashboard...</div>}>
                {children}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </AdminProtectedLayout>
  );
}
