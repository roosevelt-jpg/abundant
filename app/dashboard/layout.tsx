'use client';

import { ReactNode, Suspense } from 'react';
import { MemberProtectedLayout } from '@/components/member-protected-layout';
import { MemberSidebar } from '@/components/member-sidebar';
import { MemberHeader } from '@/components/member-header';

function MemberShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <MemberSidebar />
      <div className="flex-1 flex flex-col md:ms-64 min-w-0">
        <MemberHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
      }
    >
      <MemberProtectedLayout>
        <MemberShell>{children}</MemberShell>
      </MemberProtectedLayout>
    </Suspense>
  );
}
