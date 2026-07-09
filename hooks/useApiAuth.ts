'use client';

import { useAuth } from '@/context/AuthContext';

export function useApiAuth() {
  const { currentUser } = useAuth();

  const authFetch = async (url: string, options: RequestInit = {}) => {
    if (!currentUser) throw new Error('Not authenticated');
    const token = await currentUser.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  return { authFetch, isAuthenticated: !!currentUser };
}
