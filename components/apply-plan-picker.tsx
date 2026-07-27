'use client';

import { Check } from 'lucide-react';
import { MembershipTier, TierInterest } from '@/lib/types';
import { getDefaultMembershipTiers } from '@/lib/intake-defaults';

const FREE_PLAN = {
  id: 'free' as const,
  name: 'Free Member',
  tagline: 'Join the community at no cost while open access is available.',
  priceLabel: 'Free',
  features: [
    'Create your member profile',
    'Access community updates',
    'Apply for curated events',
    'No payment required now',
  ],
};

interface ApplyPlanPickerProps {
  tiers: MembershipTier[];
  selected: TierInterest;
  onSelect: (tier: TierInterest) => void;
  paidPlansEnabled?: boolean;
}

export function ApplyPlanPicker({
  tiers,
  selected,
  onSelect,
  paidPlansEnabled = false,
}: ApplyPlanPickerProps) {
  const source = tiers.length > 0 ? tiers : getDefaultMembershipTiers();
  const paidOptions = [...source]
    .filter((t) => t.visible !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 2);

  // Fallback if CMS has fewer than 2 — still show what we have + free
  const plans: Array<{
    id: TierInterest;
    name: string;
    tagline: string;
    priceLabel: string;
    features: string[];
    highlight?: boolean;
  }> = [
    {
      id: FREE_PLAN.id,
      name: FREE_PLAN.name,
      tagline: FREE_PLAN.tagline,
      priceLabel: FREE_PLAN.priceLabel,
      features: FREE_PLAN.features,
      highlight: true,
    },
    ...paidOptions.map((t) => ({
      id: t.id as TierInterest,
      name: t.name,
      tagline: t.tagline,
      priceLabel: `$${t.priceMonthly}/mo`,
      features: t.features.slice(0, 5),
    })),
  ];

  return (
    <section className="mb-8 sm:mb-10">
      <div className="text-center mb-5 sm:mb-6 px-1">
        <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold mb-2">Choose your plan</h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          {paidPlansEnabled
            ? 'Pick the membership that fits you, then complete the application below.'
            : 'Membership is free for everyone right now. Select a plan to tell us your preference — no payment today.'}
        </p>
      </div>

      {/* Mobile: swipeable cards · md+: 3-column grid */}
      <div className="flex md:grid md:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible scrollbar-thin">
        {plans.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan.id)}
              className={`text-left rounded-xl border p-4 sm:p-5 transition-all shrink-0 w-[85%] sm:w-[70%] md:w-auto md:min-w-0 snap-center ${
                isSelected
                  ? 'border-accent bg-accent/5 ring-2 ring-accent/40 shadow-md'
                  : 'border-border bg-card hover:border-accent/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-accent font-semibold mb-1">
                    {plan.id === 'free' ? 'Recommended' : 'Paid'}
                  </p>
                  <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                </div>
                <span
                  className={`mt-1 h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-accent bg-accent text-white' : 'border-border'
                  }`}
                >
                  {isSelected ? <Check className="w-3 h-3" /> : null}
                </span>
              </div>
              <p className="text-2xl font-bold text-accent mb-1">{plan.priceLabel}</p>
              <p className="text-xs text-muted-foreground mb-4">{plan.tagline}</p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs font-semibold text-accent">
                {isSelected ? 'Selected' : 'Select this plan'}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
