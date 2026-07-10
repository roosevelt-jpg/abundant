import {
  CareersPageContent,
  LegalPagesContent,
  PressPageContent,
  ResourcesPageContent,
} from '@/lib/types';

export function getDefaultResourcesPage(): ResourcesPageContent {
  return {
    hero: {
      eyebrow: 'RESOURCES',
      headline: 'Built by the network, for the network.',
      subtext:
        'Guides, playbooks, and briefings from members and the Abundant team — some open to all, some reserved for members.',
    },
    categories: [
      'Playbooks',
      'Market Briefings',
      'Member Spotlights',
      'Event Recaps',
      'Templates',
    ],
    lockedTitle: 'This resource is for members.',
    lockedBody: 'Join Abundant Global Club to unlock this and every resource in the library.',
    lockedCtaText: 'See membership tiers →',
    lockedCtaLink: '/membership',
    submitCta: {
      title: 'Have something worth sharing with the network?',
      body: 'Members can submit resources for consideration. Contact the team to pitch a playbook, briefing, or template.',
      buttonText: 'Contact the team',
      buttonLink: '/contact',
    },
    updatedAt: Date.now(),
  };
}

export function getDefaultCareersPage(): CareersPageContent {
  return {
    hero: {
      eyebrow: 'CAREERS',
      headline: 'Help build the network.',
      subtext:
        'Abundant Global Club is a small team running a global community. Open roles below — or send us a general application.',
    },
    generalTitle: "Don't see the right role?",
    generalBody:
      "We're always open to hearing from exceptional people who believe in what Abundant is building. Send us your background and where you'd add value.",
    generalCtaText: 'Send general application →',
    updatedAt: Date.now(),
  };
}

export function getDefaultPressPage(): PressPageContent {
  return {
    hero: {
      eyebrow: 'PRESS',
      headline: 'Abundant, in the news.',
      subtext: 'Coverage, mentions, and resources for journalists and media partners.',
    },
    inThePressTitle: 'In the Press',
    mediaKitTitle: 'Brand assets',
    mediaKitBody: 'Logos, founder headshots, and boilerplate for press use.',
    mediaKitDownloads: [
      { id: 'mk-logo', label: 'Logo pack (PNG/SVG)', url: '' },
      { id: 'mk-photos', label: 'Founder photos', url: '' },
      { id: 'mk-guidelines', label: 'Brand guidelines PDF', url: '' },
    ],
    boilerplateTitle: 'Boilerplate',
    boilerplate:
      'Abundant Global Club is a members-only network connecting principals, founders, and investors across cities worldwide. Founded to foster meaningful introductions, the club runs curated events, introductions, and a private resource library for its global membership.',
    mediaContactTitle: 'For press inquiries',
    mediaContactBody: 'Reach our media team directly.',
    mediaContactEmail: 'press@abundant.club',
    updatedAt: Date.now(),
  };
}

export function getDefaultLegalPages(): LegalPagesContent {
  const now = new Date().toISOString().slice(0, 10);
  return {
    privacy: {
      title: 'Privacy Policy',
      effectiveDate: now,
      intro:
        'This policy explains how Abundant Global Club collects, uses, and protects your information. Please have legal counsel review and finalize this language before publishing.',
      contactEmail: 'privacy@abundant.club',
      sections: [
        {
          id: 'p-overview',
          title: 'Overview',
          body: 'This Privacy Policy covers personal information we collect when you visit our website, apply for membership, register for events, or otherwise interact with Abundant Global Club.',
          order: 0,
        },
        {
          id: 'p-collect',
          title: 'Information we collect',
          body: 'We may collect application data, contact details, payment information (processed via our payment provider and not stored directly on our servers), usage data, and cookies.',
          order: 1,
        },
        {
          id: 'p-use',
          title: 'How we use your information',
          body: 'We use your information for membership review, event invitations, communications about the club, and to improve our services.',
          order: 2,
        },
        {
          id: 'p-share',
          title: 'How we share your information',
          body: 'We share data with third-party processors (payments, email, analytics) as needed to operate the platform. We do not sell your personal information to advertisers.',
          order: 3,
        },
        {
          id: 'p-rights',
          title: 'Your rights',
          body: 'Depending on your location, you may have rights to access, correct, or delete your personal data. To exercise these rights, contact us using the email below.',
          order: 4,
        },
        {
          id: 'p-retention',
          title: 'Data retention',
          body: 'We retain application and member data for as long as needed to provide services and meet legal obligations, including a reasonable period after membership cancellation.',
          order: 5,
        },
        {
          id: 'p-cookies',
          title: 'Cookies',
          body: 'We use cookies and similar technologies for authentication, preferences, and analytics. You can control cookies through your browser settings.',
          order: 6,
        },
        {
          id: 'p-contact',
          title: 'Contact',
          body: 'For privacy-related questions or requests, contact our privacy team at the email listed on this page.',
          order: 7,
        },
      ],
      updatedAt: Date.now(),
    },
    terms: {
      title: 'Terms of Service',
      effectiveDate: now,
      intro:
        'These Terms govern your use of Abundant Global Club. Please have legal counsel review and finalize this language before publishing.',
      contactEmail: 'hello@abundant.club',
      sections: [
        {
          id: 't-accept',
          title: 'Acceptance of terms',
          body: 'By accessing our website or applying for membership, you agree to these Terms of Service.',
          order: 0,
        },
        {
          id: 't-eligibility',
          title: 'Membership eligibility and application process',
          body: 'Membership is subject to application and approval. We may accept or decline applications at our discretion as described in our membership process.',
          order: 1,
        },
        {
          id: 't-fees',
          title: 'Membership fees and billing',
          body: 'Membership tiers, renewal, and refund policies are described on our membership pages and in your billing agreement with our payment provider.',
          order: 2,
        },
        {
          id: 't-conduct',
          title: 'Code of conduct',
          body: 'Members are expected to behave respectfully at events and in the member directory. We may suspend or remove members who violate community standards.',
          order: 3,
        },
        {
          id: 't-ip',
          title: 'Intellectual property',
          body: 'Resources and content shared in the library remain subject to applicable ownership and license terms. You may not redistribute members-only materials without permission.',
          order: 4,
        },
        {
          id: 't-liability',
          title: 'Limitation of liability',
          body: 'To the fullest extent permitted by law, Abundant Global Club is not liable for indirect, incidental, or consequential damages arising from your use of the platform or participation in events.',
          order: 5,
        },
        {
          id: 't-termination',
          title: 'Termination',
          body: 'You may cancel membership according to your plan terms. We may terminate access for violations of these Terms or our code of conduct.',
          order: 6,
        },
        {
          id: 't-law',
          title: 'Governing law',
          body: 'These Terms are governed by the laws of the jurisdiction specified by Abundant Global Club, without regard to conflict-of-law principles.',
          order: 7,
        },
        {
          id: 't-changes',
          title: 'Changes to these terms',
          body: 'We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated Terms.',
          order: 8,
        },
        {
          id: 't-contact',
          title: 'Contact',
          body: 'Questions about these Terms can be sent to the contact email listed on this page.',
          order: 9,
        },
      ],
      updatedAt: Date.now(),
    },
    updatedAt: Date.now(),
  };
}
