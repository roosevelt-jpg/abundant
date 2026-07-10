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
    updatedAt: Date.now(),
  };
}
