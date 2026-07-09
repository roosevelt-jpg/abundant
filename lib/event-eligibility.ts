import { Event, EventAudienceGender, User } from '@/lib/types';

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
  user: Pick<User, 'gender'> | null | undefined,
  event: Pick<Event, 'audienceGender'>
): { allowed: boolean; reason?: string } {
  const audience = event.audienceGender || 'mixed';
  if (audience === 'mixed') return { allowed: true };

  if (!user?.gender) {
    return {
      allowed: false,
      reason: 'Please complete your profile with gender information to register for this event.',
    };
  }

  if (user.gender === 'other' || user.gender === 'prefer_not_to_say') {
    return {
      allowed: false,
      reason: `This event is ${getAudienceGenderLabel(audience).toLowerCase()}.`,
    };
  }

  if (audience === 'men' && user.gender !== 'male') {
    return { allowed: false, reason: 'This event is for men only.' };
  }

  if (audience === 'women' && user.gender !== 'female') {
    return { allowed: false, reason: 'This event is for women only.' };
  }

  return { allowed: true };
}
