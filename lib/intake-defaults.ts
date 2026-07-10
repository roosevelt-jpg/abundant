import { Taxonomies, MembershipTier } from '@/lib/types';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/constants';

export const TAXONOMIES_DOC_ID = 'main';

export function getDefaultTaxonomies(): Taxonomies {
  return {
    id: 'main',
    industries: [
      'Technology',
      'Finance & Investment',
      'Real Estate',
      'Healthcare',
      'Media & Entertainment',
      'Consumer & Retail',
      'Energy',
      'Professional Services',
      'Education',
      'Other',
    ],
    howHeard: [
      'Member referral',
      'Event',
      'LinkedIn',
      'Instagram',
      'Press / media',
      'Search',
      'Other',
    ],
    eventTopics: [
      'Networking',
      'Investment',
      'Founders',
      'Wellness',
      'Culture',
      'Exclusive dinner',
    ],
    resourceCategories: [
      'Playbooks',
      'Market Briefings',
      'Member Spotlights',
      'Event Recaps',
      'Templates',
    ],
    memberGoals: [
      'Meet peers in my industry',
      'Find co-investors or partners',
      'Access curated events',
      'Learn from the network',
      'Make introductions',
      'Grow my chapter presence',
    ],
    expertiseTags: [
      'Venture capital',
      'Private equity',
      'Founder',
      'Operator',
      'Real estate',
      'Family office',
      'Marketing',
      'Product',
      'Legal',
      'Creative',
    ],
    updatedAt: Date.now(),
  };
}

/** Seed pricing — edit anytime in Admin → Membership Tiers. Based on existing plan default ($99). */
export function getDefaultMembershipTiers(): MembershipTier[] {
  const now = Date.now();
  return [
    {
      id: 'global',
      name: 'Global Member',
      tagline: 'Access the worldwide Abundant network and curated events.',
      priceMonthly: 99,
      priceAnnual: 990,
      currency: 'USD',
      features: [
        'Member directory access',
        'Invitations to global events',
        'Resource library (members-only)',
        'Introduction requests',
        'Access to free member events (from Sep 1)',
      ],
      freeEventAccess: true,
      paidEventDiscountPercent: 0,
      sortOrder: 0,
      visible: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'founding_circle',
      name: 'Founding Circle',
      tagline: 'Deeper access for principals shaping the network.',
      priceMonthly: 249,
      priceAnnual: 2490,
      currency: 'USD',
      features: [
        'Everything in Global Member',
        'Priority event access',
        'Founding Circle salons',
        'Direct host introductions',
        '10% off paid events',
      ],
      freeEventAccess: true,
      paidEventDiscountPercent: 10,
      sortOrder: 1,
      visible: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'private',
      name: 'Private Membership',
      tagline: 'The most exclusive tier for discreet, high-trust collaboration.',
      priceMonthly: 499,
      priceAnnual: 4990,
      currency: 'USD',
      features: [
        'Everything in Founding Circle',
        'Private briefings',
        'Concierge introductions',
        'Invite-only gatherings',
        '20% off paid events',
      ],
      freeEventAccess: true,
      paidEventDiscountPercent: 20,
      sortOrder: 2,
      visible: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export { PRIMARY_ADMIN_EMAIL };
