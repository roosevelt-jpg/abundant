/** Hostinger-style hosting plans — prices mirror public Hostinger Agency mockups (USD). */

export const SITE_HOSTING_DOMAIN = 'abundantglobalclub.com';

export type HostingPlanId = 'startup' | 'professional' | 'growth';
export type HostingPeriodMonths = 1 | 12 | 24;

export const HOSTING_PERIOD_OPTIONS: HostingPeriodMonths[] = [1, 12, 24];

export interface HostingPeriodPricing {
  months: HostingPeriodMonths;
  priceMonthly: number;
  priceOriginalMonthly: number;
  renewMonthly: number;
  /** One-time billed total for the term (before tax) */
  getTotal(): number;
  getOriginalTotal(): number;
  savePercent: number;
}

export interface HostingPlan {
  id: HostingPlanId;
  name: string;
  fullName: string;
  tagline: string;
  resources: string[];
  features: Array<{ label: string; badge?: 'NEW' | 'FREE' }>;
  periods: Record<HostingPeriodMonths, HostingPeriodPricing>;
}

function period(
  months: HostingPeriodMonths,
  priceMonthly: number,
  priceOriginalMonthly: number,
  renewMonthly: number,
  /** Optional billed term total (overrides priceMonthly × months). */
  billedTotal?: number
): HostingPeriodPricing {
  const savePercent = Math.round((1 - priceMonthly / priceOriginalMonthly) * 100);
  return {
    months,
    priceMonthly,
    priceOriginalMonthly,
    renewMonthly,
    savePercent,
    getTotal: () => billedTotal ?? Math.round(priceMonthly * months * 100) / 100,
    getOriginalTotal: () => Math.round(priceOriginalMonthly * months * 100) / 100,
  };
}

export function formatHostingPeriodLabel(months: HostingPeriodMonths): string {
  if (months === 1) return '1 month';
  return `${months} months`;
}

export const HOSTING_PLANS: HostingPlan[] = [
  {
    id: 'startup',
    name: 'Startup',
    fullName: 'Agency Startup',
    tagline: 'Optimized for business and ecommerce websites.',
    resources: [
      '6 CPU cores',
      '12 GB RAM',
      '300 GB NVMe storage',
      '4,000,000 inodes (files and directories)',
      '100 websites',
      '10 mailboxes per website – free for 1 year',
    ],
    features: [
      { label: 'Priority 24/7 expert support' },
      { label: 'Full website isolation', badge: 'NEW' },
      { label: 'Access sharing per site', badge: 'NEW' },
      { label: 'Unbranded client dashboard', badge: 'NEW' },
      { label: 'Proactive monitoring alerts', badge: 'NEW' },
      { label: 'Unlimited CDN & SSL', badge: 'FREE' },
      { label: '5 vibe coding credits', badge: 'FREE' },
      { label: 'Dedicated IP address' },
      { label: 'Daily backups' },
      { label: 'Managed hosting for WordPress and WooCommerce' },
      { label: '30-Day money-back guarantee' },
    ],
    periods: {
      // $14.99/mo — 12-month term billed as $188.87
      1: period(1, 14.99, 29, 14.99),
      12: period(12, 14.99, 29, 14.99, 188.87),
      24: period(24, 14.99, 29, 14.99),
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    fullName: 'Agency Professional',
    tagline: 'For agencies managing multiple client sites.',
    resources: [
      '12 CPU cores',
      '24 GB RAM',
      '500 GB NVMe storage',
      '6,000,000 inodes (files and directories)',
      '200 websites',
      '20 mailboxes per website – free for 1 year',
    ],
    features: [
      { label: 'Priority 24/7 expert support' },
      { label: 'Full website isolation', badge: 'NEW' },
      { label: 'Access sharing per site', badge: 'NEW' },
      { label: 'Unbranded client dashboard', badge: 'NEW' },
      { label: 'Proactive monitoring alerts', badge: 'NEW' },
      { label: 'Unlimited CDN & SSL', badge: 'FREE' },
      { label: '20 vibe coding credits', badge: 'FREE' },
      { label: 'Dedicated IP address' },
      { label: 'Daily backups' },
      { label: 'Managed hosting for WordPress and WooCommerce' },
      { label: '30-Day money-back guarantee' },
    ],
    periods: {
      1: period(1, 69, 99, 69),
      12: period(12, 39, 99, 69),
      24: period(24, 39, 99, 69),
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    fullName: 'Agency Growth',
    tagline: 'Maximum resources for high-traffic projects.',
    resources: [
      '16 CPU cores',
      '32 GB RAM',
      '750 GB NVMe storage',
      '8,000,000 inodes (files and directories)',
      '300 websites',
      '30 mailboxes per website – free for 1 year',
    ],
    features: [
      { label: 'Priority 24/7 expert support' },
      { label: 'Full website isolation', badge: 'NEW' },
      { label: 'Access sharing per site', badge: 'NEW' },
      { label: 'Unbranded client dashboard', badge: 'NEW' },
      { label: 'Proactive monitoring alerts', badge: 'NEW' },
      { label: 'Unlimited CDN & SSL', badge: 'FREE' },
      { label: '50 vibe coding credits', badge: 'FREE' },
      { label: 'Dedicated IP address' },
      { label: 'Daily backups' },
      { label: 'Managed hosting for WordPress and WooCommerce' },
      { label: '30-Day money-back guarantee' },
    ],
    periods: {
      1: period(1, 99, 149, 99),
      12: period(12, 59, 149, 99),
      24: period(24, 59, 149, 99),
    },
  },
];

/** Flat tax rate applied on checkout summary (matches Hostinger-style tax line). */
export const HOSTING_TAX_RATE = 0;

export function getHostingPlan(id: string): HostingPlan | undefined {
  return HOSTING_PLANS.find((p) => p.id === id);
}

export function parseHostingPeriod(value: unknown): HostingPeriodMonths {
  const n = Number(value);
  if (n === 1 || n === 12 || n === 24) return n;
  return 12;
}

export function calculateHostingOrder(
  planId: HostingPlanId,
  periodMonths: HostingPeriodMonths
) {
  const plan = getHostingPlan(planId);
  if (!plan) throw new Error('Invalid plan');
  const pricing = plan.periods[periodMonths];
  const subtotal = pricing.getTotal();
  const originalSubtotal = pricing.getOriginalTotal();
  const tax = Math.round(subtotal * HOSTING_TAX_RATE);
  const originalTax = Math.round(originalSubtotal * HOSTING_TAX_RATE);
  const total = subtotal + tax;
  const originalTotal = originalSubtotal + originalTax;
  const savings = originalTotal - total;

  const periodLabel =
    periodMonths === 1 ? '1-month period' : `${periodMonths}-month period`;

  return {
    plan,
    pricing,
    periodMonths,
    currency: 'usd' as const,
    lines: [
      {
        id: 'plan',
        label: `${plan.fullName} (${periodLabel})`,
        amount: subtotal,
        originalAmount: originalSubtotal,
      },
      { id: 'backup', label: 'Daily backup', amount: 0, originalAmount: Math.round(1.99 * periodMonths) },
      { id: 'domain', label: 'Domain', amount: 0, originalAmount: 16.99 },
      { id: 'privacy', label: 'Domain privacy protection', amount: 0, originalAmount: 0 },
    ],
    tax,
    originalTax,
    subtotal,
    total,
    originalTotal,
    savings,
    /** Stripe amount in cents */
    amountCents: Math.round(total * 100),
  };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
