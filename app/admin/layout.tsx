'use client';

import { AdminProtectedLayout } from '@/components/admin-protected-layout';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';
import { ReactNode, Suspense } from 'react';

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <AdminHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>}>
      <AdminProtectedLayout>
        <AdminShell>{children}</AdminShell>
      </AdminProtectedLayout>
    </Suspense>
  );
}
