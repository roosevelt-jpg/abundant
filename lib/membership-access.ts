import { isMembershipOpenAccess } from '@/lib/constants';
import { MembershipTier, MembershipTierId, MemberRecord, User } from '@/lib/types';

export type MembershipAccessReason =
  | 'free_period'
  | 'open_access'
  | 'active_subscription'
  | 'active_member_tier'
  | 'membership_required';

export function mapLegacyUserTier(tier?: string): MembershipTierId | undefined {
  if (!tier) return undefined;
  if (tier === 'global' || tier === 'founding_circle' || tier === 'private') return tier;
  if (tier === 'member') return 'global';
  if (tier === 'elite') return 'founding_circle';
  if (tier === 'inner-circle') return 'private';
  return undefined;
}

/** True when the member may use free events / member discounts. */
export function hasEventMembershipAccess(
  user: Pick<User, 'subscriptionStatus' | 'membershipTier'> | null | undefined,
  member?: Pick<MemberRecord, 'tierStatus' | 'tier'> | null,
  paidPlansEnabled?: boolean | null
): { allowed: boolean; reason: MembershipAccessReason } {
  if (isMembershipOpenAccess(paidPlansEnabled)) {
    return {
      allowed: true,
      reason: paidPlansEnabled === true ? 'free_period' : 'open_access',
    };
  }

  const sub = user?.subscriptionStatus;
  if (sub === 'active' || sub === 'trialing') {
    return { allowed: true, reason: 'active_subscription' };
  }

  if (member?.tierStatus === 'active' && member.tier) {
    return { allowed: true, reason: 'active_member_tier' };
  }

  return { allowed: false, reason: 'membership_required' };
}

export function resolveMemberTierId(
  user?: Pick<User, 'membershipTier'> | null,
  member?: Pick<MemberRecord, 'tier'> | null
): MembershipTierId | undefined {
  return member?.tier || mapLegacyUserTier(user?.membershipTier);
}

export function getTierPaidEventDiscountPercent(
  tierId: MembershipTierId | undefined,
  tiers: MembershipTier[]
): number {
  if (!tierId) return 0;
  const tier = tiers.find((t) => t.id === tierId);
  const pct = tier?.paidEventDiscountPercent ?? defaultDiscountForTier(tierId);
  return Math.min(100, Math.max(0, pct));
}

export function defaultDiscountForTier(tierId: MembershipTierId): number {
  switch (tierId) {
    case 'private':
      return 20;
    case 'founding_circle':
      return 10;
    case 'global':
    default:
      return 0;
  }
}

export function applyMembershipDiscount(basePrice: number, discountPercent: number): {
  finalPrice: number;
  discountAmount: number;
} {
  if (basePrice <= 0 || discountPercent <= 0) {
    return { finalPrice: basePrice, discountAmount: 0 };
  }
  const discountAmount = Math.round(basePrice * (discountPercent / 100) * 100) / 100;
  return {
    finalPrice: Math.max(0, Math.round((basePrice - discountAmount) * 100) / 100),
    discountAmount,
  };
}

export const MEMBERSHIP_REQUIRED_MESSAGE =
  'Membership is required to register for events from September 1. Upgrade your membership to continue — free events are included, and paid events include member discounts.';
