'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { HostingerLogo } from '@/components/hostinger-logo';
import { SITE_HOSTING_DOMAIN } from '@/lib/hosting-plans';
import { SiteHostingStatus } from '@/lib/types';

export default function AdminHostingPage() {
  const { authFetch, isAuthenticated } = useApiAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [siteHosting, setSiteHosting] = useState<SiteHostingStatus | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await authFetch('/api/admin/hosting/config');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load hosting');
        if (!cancelled) setSiteHosting(data.siteHosting || null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const isConnected = siteHosting?.status === 'active';

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">Loading hosting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#0A1220] text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl mx-auto py-12 sm:py-20">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#121C2E] px-6 py-12 sm:px-10 sm:py-16 text-center space-y-8">
          <div className="flex justify-center">
            <HostingerLogo height={48} onDark />
          </div>

          {isConnected ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-[#0A1220] text-sm font-bold">
                <Check className="w-4 h-4" strokeWidth={3} />
                Hosting Connected
              </div>
              <div className="space-y-1">
                <p className="font-heading text-lg font-bold">
                  {siteHosting?.domain || SITE_HOSTING_DOMAIN}
                </p>
                {siteHosting?.planName && (
                  <p className="text-sm text-white/60">
                    {siteHosting.planName}
                    {siteHosting.periodMonths ? ` · ${siteHosting.periodMonths}-month term` : ''}
                    {siteHosting.expiresAt
                      ? ` · renews ${new Date(siteHosting.expiresAt).toLocaleDateString()}`
                      : ''}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-white/70 text-sm">
                Hosting is not connected yet.
              </p>
              <Link
                href="/admin/hosting/checkout?plan=startup&period=12"
                className="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#001F3F] to-[#B8973A]"
              >
                Connect hosting
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
