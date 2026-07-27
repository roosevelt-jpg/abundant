import { HomePageContent } from '@/lib/types';

export function getDefaultHomePage(): HomePageContent {
  return {
    eventsSection: {
      title: 'Upcoming Events',
      subtitle: "Don't miss our next gatherings",
      linkText: 'View All Events',
      emptyMessage: 'No upcoming events scheduled',
    },
    featuresSection: {
      title: 'Why Join Abundant?',
      subtitle: 'Experience the power of an elite global network',
      cards: [
        { id: 'f1', icon: 'globe', title: 'Global Community', description: 'Connect with success-minded individuals across the world', order: 0 },
        { id: 'f2', icon: 'calendar', title: 'Exclusive Events', description: 'Attend curated events and networking opportunities', order: 1 },
        { id: 'f3', icon: 'users', title: 'Collaboration', description: 'Partner on exclusive opportunities and ventures', order: 2 },
        { id: 'f4', icon: 'zap', title: 'Growth', description: 'Accelerate your personal and professional growth', order: 3 },
      ],
    },
    ctaSection: {
      enabled: true,
      title: 'Ready to Join Abundant?',
      subtitle: 'Start your journey towards abundant living and global success today.',
      buttonText: 'Get Started Now',
      buttonLink: '/apply',
    },
    partnersSection: {
      enabled: false,
      title: 'Our Partners',
      speed: 40,
      direction: 'left',
      easing: 'linear',
      pauseOnHover: true,
      grayscale: true,
      showEdgeFade: true,
      gap: 48,
      logoHeight: 48,
      partners: [],
    },
    updatedAt: Date.now(),
  };
}

/** Merge stored homepage content with defaults (handles older settings docs). */
export function resolveHomePage(home?: Partial<HomePageContent> | null): HomePageContent {
  const defaults = getDefaultHomePage();
  if (!home) return defaults;
  return {
    ...defaults,
    ...home,
    eventsSection: { ...defaults.eventsSection, ...home.eventsSection },
    featuresSection: {
      ...defaults.featuresSection,
      ...home.featuresSection,
      cards: home.featuresSection?.cards?.length ? home.featuresSection.cards : defaults.featuresSection.cards,
    },
    partnersSection: {
      ...defaults.partnersSection,
      ...home.partnersSection,
      partners: home.partnersSection?.partners ?? defaults.partnersSection.partners,
    },
    ctaSection: { ...defaults.ctaSection, ...home.ctaSection },
  };
}
