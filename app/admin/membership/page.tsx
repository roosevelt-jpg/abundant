'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MembershipPlansEditor from './editor';

export default function MembershipAdmin() {
  const { currentUser, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (userData?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [currentUser, userData, router]);

  if (!currentUser || userData?.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <MembershipPlansEditor />
    </div>
  );
}
