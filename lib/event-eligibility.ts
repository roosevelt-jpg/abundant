import { Event, EventAudienceGender, MemberRecord, User } from '@/lib/types';
import {
  hasEventMembershipAccess,
  MEMBERSHIP_REQUIRED_MESSAGE,
} from '@/lib/membership-access';

export function getAudienceGenderLabel(audience?: EventAudienceGender): string {
  switch (audience || 'mixed') {
    case 'men':
      return 'Men only';
    case 'women':
      return 'Women only';
    default:
      return 'Open to all';
  }
}

export function canUserRegisterForEvent(
  user: Pick<User, 'gender' | 'subscriptionStatus' | 'membershipTier'> | null | undefined,
  event: Pick<Event, 'audienceGender'>,
  member?: Pick<MemberRecord, 'tierStatus' | 'tier'> | null
): { allowed: boolean; reason?: string; code?: 'GENDER' | 'MEMBERSHIP_REQUIRED' | 'PROFILE' } {
  const audience = event.audienceGender || 'mixed';
  if (audience !== 'mixed') {
    if (!user?.gender) {
      return {
        allowed: false,
        code: 'PROFILE',
        reason: 'Please complete your profile with gender information to register for this event.',
      };
    }

    if (user.gender === 'other' || user.gender === 'prefer_not_to_say') {
      return {
        allowed: false,
        code: 'GENDER',
        reason: `This event is ${getAudienceGenderLabel(audience).toLowerCase()}.`,
      };
    }

    if (audience === 'men' && user.gender !== 'male') {
      return { allowed: false, code: 'GENDER', reason: 'This event is for men only.' };
    }

    if (audience === 'women' && user.gender !== 'female') {
      return { allowed: false, code: 'GENDER', reason: 'This event is for women only.' };
    }
  }

  const membership = hasEventMembershipAccess(user, member);
  if (!membership.allowed) {
    return {
      allowed: false,
      code: 'MEMBERSHIP_REQUIRED',
      reason: MEMBERSHIP_REQUIRED_MESSAGE,
    };
  }

  return { allowed: true };
}
