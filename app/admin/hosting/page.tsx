'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, Info } from 'lucide-react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { HostingerLogo } from '@/components/hostinger-logo';
import {
  formatHostingPeriodLabel,
  formatUsd,
  HostingPeriodMonths,
  HostingPlanId,
  HOSTING_PERIOD_OPTIONS,
  SITE_HOSTING_DOMAIN,
} from '@/lib/hosting-plans';
import { SiteHostingStatus } from '@/lib/types';

const HOSTINGER_PRO_URL = 'https://www.hostinger.com/pro';

type PlanPayload = {
  id: HostingPlanId;
  name: string;
  fullName: string;
  tagline: string;
  resources: string[];
  features: Array<{ label: string; badge?: 'NEW' | 'FREE' }>;
  periods: Record<
    HostingPeriodMonths,
    {
      months: number;
      priceMonthly: number;
      priceOriginalMonthly: number;
      renewMonthly: number;
      savePercent: number;
      total: number;
      originalTotal: number;
    }
  >;
};

const PLAN_ORDER: HostingPlanId[] = ['startup', 'professional', 'growth'];

export default function AdminHostingPage() {
  const { authFetch, isAuthenticated } = useApiAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<PlanPayload[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePlanId, setActivePlanId] = useState<HostingPlanId>('startup');
  const [previewPeriod, setPreviewPeriod] = useState<HostingPeriodMonths>(12);
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
        if (cancelled) return;
        setPlans(data.plans || []);
        setConfigured(!!data.configured);
        setSiteHosting(data.siteHosting || null);
        if (data.siteHosting?.planId) setActivePlanId(data.siteHosting.planId);
        else if (data.plans?.[0]?.id) setActivePlanId(data.plans[0].id);
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

  const activePlan = useMemo(
    () => plans.find((p) => p.id === activePlanId) || plans[0],
    [plans, activePlanId]
  );
  const pricing = activePlan?.periods[previewPeriod];

  const choosePlan = () => {
    if (!activePlan) return;
    router.push(`/admin/hosting/checkout?plan=${activePlan.id}&period=${previewPeriod}`);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">Loading hosting plans…</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#0A1220] text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={HOSTINGER_PRO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex hover:opacity-90 transition-opacity"
              title="Open Hostinger Pro pricing"
            >
              <HostingerLogo height={40} onDark />
            </a>
            <span className="text-xs px-2.5 py-1 rounded-full border border-[#B8973A]/40 text-[#D4AF87]">
              for Abundant Global
            </span>
          </div>
          <Link
            href="/admin/settings?tab=integrations"
            className="text-sm text-[#D4AF87] hover:text-[#B8973A] underline-offset-2 hover:underline"
          >
            Configure Stripe
          </Link>
        </div>

        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-white/65">
            Compare live Hostinger Pro pricing anytime.
          </p>
          <a
            href={HOSTINGER_PRO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#D4AF87] hover:text-[#B8973A] break-all"
          >
            hostinger.com/pro
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>

        {/* Site status for abundantglobalclub.com */}
        <div
          className={`mb-6 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            siteHosting?.status === 'active'
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : siteHosting?.status === 'expired'
                ? 'border-amber-500/40 bg-amber-500/10'
                : 'border-white/10 bg-white/5'
          }`}
        >
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Site hosting</p>
            <p className="font-heading text-lg font-bold">
              {siteHosting?.domain || SITE_HOSTING_DOMAIN}
            </p>
            {siteHosting?.status === 'active' && siteHosting.planName && (
              <p className="text-sm text-white/65 mt-1">
                {siteHosting.planName}
                {siteHosting.periodMonths ? ` · ${siteHosting.periodMonths}-month term` : ''}
                {siteHosting.expiresAt
                  ? ` · renews ${new Date(siteHosting.expiresAt).toLocaleDateString()}`
                  : ''}
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-full text-sm font-bold ${
              siteHosting?.status === 'active'
                ? 'bg-emerald-500 text-[#0A1220]'
                : siteHosting?.status === 'expired'
                  ? 'bg-amber-400 text-[#0A1220]'
                  : 'bg-white/15 text-white/80'
            }`}
          >
            {siteHosting?.status === 'active' && <Check className="w-4 h-4" strokeWidth={3} />}
            {siteHosting?.status === 'active'
              ? 'Active'
              : siteHosting?.status === 'expired'
                ? 'Expired'
                : 'Inactive'}
          </span>
        </div>

        {!configured && (
          <div className="mb-6 rounded-xl border border-[#B8973A]/40 bg-[#B8973A]/10 px-4 py-3 text-sm text-[#D4AF87]">
            Stripe is not configured yet. Add publishable and secret keys under{' '}
            <Link href="/admin/settings?tab=integrations" className="underline font-semibold">
              Settings → Integrations → Stripe
            </Link>
            , then return here to purchase.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {activePlan && pricing && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 lg:gap-8 items-start">
            {/* Left: plan details */}
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">{activePlan.fullName}</h1>
              <p className="text-white/60 mb-6">{activePlan.tagline}</p>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-white/10 mb-4">
                {PLAN_ORDER.map((id) => {
                  const plan = plans.find((p) => p.id === id);
                  if (!plan) return null;
                  const active = activePlanId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActivePlanId(id)}
                      className={`pb-3 text-sm font-semibold transition-colors relative ${
                        active ? 'text-[#B8973A]' : 'text-white/45 hover:text-white/80'
                      }`}
                    >
                      {plan.name}
                      {active && (
                        <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#B8973A] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Slider track */}
              <div className="relative h-8 mb-6 px-1">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-white/10" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-[#B8973A]/50"
                  style={{
                    left: 0,
                    width: `${(PLAN_ORDER.indexOf(activePlanId) / (PLAN_ORDER.length - 1)) * 100}%`,
                  }}
                />
                {PLAN_ORDER.map((id, i) => {
                  const left = `${(i / (PLAN_ORDER.length - 1)) * 100}%`;
                  const active = activePlanId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-label={id}
                      onClick={() => setActivePlanId(id)}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all ${
                        active
                          ? 'h-5 w-5 bg-[#B8973A] shadow-[0_0_16px_rgba(184,151,58,0.7)] ring-4 ring-[#B8973A]/25'
                          : 'h-2.5 w-2.5 bg-white/35 hover:bg-white/60'
                      }`}
                      style={{ left }}
                    />
                  );
                })}
              </div>

              {/* Resources */}
              <div className="rounded-2xl bg-[#121C2E] border border-white/8 p-5 sm:p-6">
                <p className="text-[11px] tracking-[0.14em] uppercase text-white/45 font-semibold mb-4">
                  Resources
                </p>
                <ul className="space-y-3">
                  {activePlan.resources.map((r) => (
                    <li key={r} className="text-sm sm:text-base font-semibold text-white">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: pricing card */}
            <div className="rounded-2xl bg-[#121C2E] border border-[#B8973A]/25 p-5 sm:p-6 shadow-[0_0_40px_rgba(15,27,46,0.5)] lg:sticky lg:top-6">
              <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
                Duration
              </label>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {HOSTING_PERIOD_OPTIONS.map((months) => {
                  const selected = previewPeriod === months;
                  return (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setPreviewPeriod(months)}
                      className={`rounded-xl px-2 py-2.5 text-xs sm:text-sm font-semibold border transition-colors ${
                        selected
                          ? 'border-[#B8973A] bg-[#B8973A]/15 text-[#D4AF87]'
                          : 'border-white/10 text-white/60 hover:border-white/25'
                      }`}
                    >
                      {formatHostingPeriodLabel(months)}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {pricing.savePercent > 0 && (
                  <>
                    <span className="text-white/45 line-through text-lg">
                      {formatUsd(pricing.priceOriginalMonthly)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#B8973A] text-[#0A1220]">
                      SAVE {pricing.savePercent}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-4xl sm:text-5xl font-bold mb-5">
                {formatUsd(pricing.priceMonthly)}
                <span className="text-lg font-semibold text-white/50">/mo</span>
              </p>

              <button
                type="button"
                onClick={choosePlan}
                disabled={!configured}
                className="w-full min-h-[48px] rounded-xl font-semibold text-sm sm:text-base bg-gradient-to-r from-[#001F3F] to-[#B8973A] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                Choose plan
              </button>

              <p className="text-xs text-white/45 mt-3 text-center">
                For {formatHostingPeriodLabel(previewPeriod)} term
                {previewPeriod === 1 ? '' : '.'}{' '}
                {formatUsd(pricing.renewMonthly)}/mo when you renew
              </p>

              <ul className="mt-6 space-y-3 border-t border-white/10 pt-5">
                {activePlan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-[#B8973A] shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="text-white/85 flex-1">
                      {f.label}
                      {f.badge && (
                        <span className="ml-2 inline-flex align-middle text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-[#B8973A]/20 text-[#D4AF87]">
                          {f.badge}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 flex items-start gap-2 text-xs text-white/45">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                You&apos;ll confirm period and total on the next step before entering card details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
