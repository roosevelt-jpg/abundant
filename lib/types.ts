// User types for Firestore
export type UserRole = 'member' | 'admin' | 'super_admin';

export type MembershipTierId = 'global' | 'founding_circle' | 'private';

export type AdminPermission =
  | 'dashboard'
  | 'members'
  | 'events'
  | 'testimonials'
  | 'billing'
  | 'pages'
  | 'about'
  | 'forms'
  | 'hero'
  | 'contact'
  | 'chatbot'
  | 'faq'
  | 'resources'
  | 'careers'
  | 'press'
  | 'legal'
  | 'applications'
  | 'invites'
  | 'settings';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  permissions?: AdminPermission[];
  membershipTier: 'member' | 'elite' | 'inner-circle' | MembershipTierId;
  joinedAt: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: number;
  updatedAt: number;
  phone?: string;
  bio?: string;
  title?: string;
  /** ISO country code — country of residence */
  country?: string;
  countryOfResidence?: string;
  nationality?: string;
  citizenship?: string;
  city?: string;
  address?: string;
  locationPlaceId?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  profession?: string;
  joinReason?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  planId?: string;
  /** FCM device tokens for push notifications */
  fcmTokens?: string[];
  /** Set after branded welcome email is sent post-verification */
  welcomeEmailSentAt?: number;
  emailVerifiedAt?: number;
}

export interface MemberProfile {
  /** ISO country code — country of residence */
  country?: string;
  countryOfResidence?: string;
  nationality?: string;
  citizenship?: string;
  city?: string;
  address?: string;
  locationPlaceId?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  profession?: string;
  joinReason?: string;
}

// Admin invite codes
export interface AdminInvite {
  id: string;
  code: string;
  role: 'admin' | 'super_admin';
  email: string;
  permissions?: AdminPermission[];
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
  usedBy?: string;
  status: 'pending' | 'used' | 'expired' | 'revoked';
}

// FAQ items
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
}

// Event types for Firestore
export type EventAudienceGender = 'mixed' | 'men' | 'women';

export interface EventTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  order: number;
  active: boolean;
  createdAt: number;
}

export interface EventDiscountCode {
  id: string;
  code: string;
  eventIds: string[];
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: number;
  active: boolean;
  createdBy: string;
  createdAt: number;
}

export type EventFormat = 'in-person' | 'virtual' | 'hybrid';
export type EventRegistrationMode = 'open' | 'approval' | 'invite_only';

export interface EventTicketTier {
  id: string;
  name: string;
  description?: string;
  price: number;
  capacity?: number;
  sold?: number;
  /** Hide from public after this time */
  salesEndAt?: number;
}

export interface EventHost {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  imageUrl?: string;
  email?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
}

export type EventRecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface EventRecurrence {
  frequency: EventRecurrenceFrequency;
  /** Number of occurrences including the first (2–52) */
  count: number;
  /** Optional end date (ms) — stops earlier if reached before count */
  until?: number;
}

export interface EventInvite {
  id: string;
  eventId: string;
  email: string;
  code: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string;
  invitedAt: number;
  acceptedAt?: number;
  acceptedBy?: string;
  expiresAt: number;
}

export interface Event {
  id: string;
  title: string;
  /** URL-friendly unique slug for /events/[slug] */
  slug?: string;
  description: string;
  /** Short teaser shown on cards (Luma-style subtitle) */
  subtitle?: string;
  date: number;
  endDate?: number;
  timezone?: string;
  location: string;
  locationPlaceId?: string;
  virtualLink?: string;
  format?: EventFormat;
  capacity?: number;
  registered: number;
  waitlistCount?: number;
  enableWaitlist?: boolean;
  imageUrl?: string;
  category: 'networking' | 'workshop' | 'webinar' | 'conference' | 'other';
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isPublic: boolean;
  /** How guests join: open RSVP, host approval, or invite-only */
  registrationMode?: EventRegistrationMode;
  pricingType: 'free' | 'paid';
  price?: number;
  currency?: string;
  stripePriceId?: string;
  /** Multiple ticket types (Luma-style). If empty, use pricingType/price. */
  ticketTiers?: EventTicketTier[];
  audienceGender?: EventAudienceGender;
  tags?: string[];
  hosts?: EventHost[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  attendees?: string[];
  agenda?: { id?: string; time: string; title: string; speaker?: string }[];
  speakers?: { id?: string; name: string; title?: string; bio?: string; image?: string }[];
  /** Show guest list on public page */
  showGuestList?: boolean;
  /** Require approval before confirmed (alias of registrationMode === 'approval') */
  requireApproval?: boolean;
  /** Shared id across recurring occurrences */
  seriesId?: string;
  /** Index within series (0 = first) */
  seriesIndex?: number;
  recurrence?: EventRecurrence;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  registeredAt: number;
  status: 'registered' | 'attended' | 'cancelled' | 'waitlisted' | 'pending' | 'declined';
  paymentStatus?: 'free' | 'paid' | 'pending' | 'failed';
  stripePaymentId?: string;
  amountPaid?: number;
  discountCode?: string;
  discountAmount?: number;
  checkInTime?: number;
  /** Short code / token encoded in guest QR for door check-in */
  checkInCode?: string;
  ticketTierId?: string;
  ticketTierName?: string;
  inviteCode?: string;
}

// Membership plans (Stripe billing products — may link to membershipTiers)
export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  benefits: string[];
  tier: 'member' | 'elite' | 'inner-circle' | MembershipTierId;
  stripePriceId?: string;
  stripeProductId?: string;
  active: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

/** CMS single source of truth for public tiers, apply form, and onboarding */
export interface MembershipTier {
  id: MembershipTierId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  features: string[];
  /** After free period: members with an active paid tier can RSVP to free events */
  freeEventAccess?: boolean;
  /** Percent off paid event tickets for active members of this tier */
  paidEventDiscountPercent?: number;
  sortOrder: number;
  visible: boolean;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Taxonomies {
  id: 'main';
  industries: string[];
  howHeard: string[];
  eventTopics: string[];
  resourceCategories: string[];
  memberGoals: string[];
  expertiseTags: string[];
  updatedAt: number;
}

export type MembershipApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type TierInterest = MembershipTierId | 'not_sure';

export interface MembershipApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  nationality?: string;
  citizenship?: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  role: string;
  company: string;
  industry: string;
  linkedinUrl?: string;
  yearsExperience?: number;
  whyJoin: string;
  goals: string[];
  tierInterest: TierInterest;
  referredByMember: boolean;
  referrerName?: string;
  howHeard: string;
  termsAcceptedAt: number;
  marketingConsent: boolean;
  status: MembershipApplicationStatus;
  reviewedBy?: string;
  reviewedAt?: number;
  reviewNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export type MembershipInviteStatus = 'sent' | 'used' | 'expired';

export interface MembershipInvite {
  id: string;
  applicationId: string;
  email: string;
  token: string;
  status: MembershipInviteStatus;
  expiresAt: number;
  createdAt: number;
  usedAt?: number;
}

export type DirectoryVisibility = 'public' | 'members_only' | 'hidden';
export type MemberTierStatus = 'active' | 'past_due' | 'cancelled' | 'pending';

export interface MemberRecord {
  uid: string;
  applicationId?: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  bio?: string;
  expertiseTags: string[];
  directoryVisibility: DirectoryVisibility;
  socialLinks: {
    x?: string;
    instagram?: string;
    linkedin?: string;
  };
  availableForIntros: boolean;
  tier?: MembershipTierId;
  tierStatus: MemberTierStatus;
  notificationPrefs: {
    eventInvites: boolean;
    weeklyDigest: boolean;
    introRequests: boolean;
  };
  onboardingCompletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export type ResourceSubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface ResourceSubmission {
  id: string;
  submittedByUid?: string;
  name: string;
  email: string;
  title: string;
  category: string;
  description: string;
  fileUrl?: string;
  status: ResourceSubmissionStatus;
  reviewedBy?: string;
  reviewedAt?: number;
  reviewNotes?: string;
  createdAt: number;
  updatedAt: number;
}

// Testimonial types
export interface Testimonial {
  id: string;
  authorName: string;
  authorTitle?: string;
  authorImage?: string;
  content: string;
  rating: number;
  eventId?: string;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

// CMS content blocks
export interface ContentBlock {
  id: string;
  type: 'text' | 'heading' | 'image' | 'html';
  content: string;
  order: number;
}

export type FooterPlacement = 'platform' | 'company' | 'connect' | 'none';
export type NavPlacement = 'top-level' | NavMenuChild | 'none';
export type NavMenuChild = 'home' | 'about' | 'events' | 'membership' | 'contact';

export interface PageSEO {
  title?: string;
  description?: string;
  keywords?: string;
}

// CMS Page type
export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentBlocks?: ContentBlock[];
  isPublished: boolean;
  footerPlacement?: FooterPlacement;
  navPlacement?: NavPlacement;
  navParent?: NavMenuChild;
  seo?: PageSEO;
  pageType?: 'standard' | 'about' | 'home' | 'contact' | 'events' | 'membership';
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// About page sections
export interface SideBySideCard {
  id: string;
  title: string;
  text: string;
  imageUrl: string;
  imagePosition: 'left' | 'right';
  order: number;
}

export interface CoreValue {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface TeamMemberSocial {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  social: TeamMemberSocial;
  suspended: boolean;
  order: number;
}

export interface AboutHighlightCard {
  id: string;
  title: string;
  text: string;
  order: number;
}

export interface AboutPageContent {
  pageTitle?: string;
  pageSubtitle?: string;
  highlightCards?: AboutHighlightCard[];
  foundersMessage?: SideBySideCard;
  missionVision?: SideBySideCard;
  coreValues: CoreValue[];
  teamMembers: TeamMember[];
  updatedAt: number;
}

/** Shared hero + CTA blocks for marketing content pages */
export interface ContentPageHero {
  eyebrow: string;
  headline: string;
  subtext: string;
}

export interface ContentPageCta {
  title: string;
  body: string;
  buttonText: string;
  buttonLink: string;
}

export type ResourceAccess = 'public' | 'members';
export type ResourceFormat = 'article' | 'download' | 'photo_essay' | 'other';

export interface ResourceItem {
  id: string;
  title: string;
  category: string;
  summary?: string;
  body?: string;
  access: ResourceAccess;
  format: ResourceFormat;
  readTime?: string;
  downloadUrl?: string;
  coverImageUrl?: string;
  order: number;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ResourcesPageContent {
  hero: ContentPageHero;
  categories: string[];
  lockedTitle: string;
  lockedBody: string;
  lockedCtaText: string;
  lockedCtaLink: string;
  submitCta: ContentPageCta;
  updatedAt: number;
}

export type JobEmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: JobEmploymentType;
  about: string;
  responsibilities: string[];
  requirements: string[];
  order: number;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface JobApplication {
  id: string;
  jobId?: string;
  jobTitle?: string;
  isGeneral: boolean;
  fullName: string;
  email: string;
  linkedinOrPortfolio?: string;
  cvUrl?: string;
  coverNote: string;
  status: 'new' | 'reviewed' | 'archived';
  submittedAt: number;
}

export interface CareersPageContent {
  hero: ContentPageHero;
  generalTitle: string;
  generalBody: string;
  generalCtaText: string;
  updatedAt: number;
}

export interface PressItem {
  id: string;
  outletName: string;
  outletLogoUrl?: string;
  headline: string;
  dateLabel: string;
  url: string;
  order: number;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MediaKitDownload {
  id: string;
  label: string;
  url: string;
}

export interface PressPageContent {
  hero: ContentPageHero;
  inThePressTitle: string;
  mediaKitTitle: string;
  mediaKitBody: string;
  mediaKitDownloads: MediaKitDownload[];
  boilerplateTitle: string;
  boilerplate: string;
  mediaContactTitle: string;
  mediaContactBody: string;
  mediaContactEmail: string;
  updatedAt: number;
}

export interface LegalSection {
  id: string;
  title: string;
  body: string;
  order: number;
}

export interface LegalDocumentContent {
  title: string;
  effectiveDate: string;
  intro?: string;
  sections: LegalSection[];
  contactEmail: string;
  updatedAt: number;
}

export interface LegalPagesContent {
  privacy: LegalDocumentContent;
  terms: LegalDocumentContent;
  updatedAt: number;
}

// Custom forms
export type FormFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'file';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

export interface CustomForm {
  id: string;
  name: string;
  fields: FormField[];
  placement: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FormSubmission {
  id: string;
  formId: string;
  formName: string;
  data: Record<string, string>;
  status: 'new' | 'responded' | 'archived';
  submittedAt: number;
  replies?: { message: string; sentAt: number; sentBy: string }[];
}

// Contact submissions
export interface ActivityLog {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'member' | 'event' | 'page' | 'plan' | 'testimonial' | 'form' | 'contact' | 'settings' | 'invite';
  entityId?: string;
  description: string;
  actorId: string;
  actorName: string;
  createdAt: number;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'responded' | 'archived';
  submittedAt: number;
  replies?: { message: string; sentAt: number; sentBy: string }[];
}

// Hero slider
export interface HeroSlide {
  id: string;
  image: string;
  badge?: string;
  title: string;
  subtitle?: string;
  description?: string;
  cta?: { text: string; link: string };
  secondaryCta?: { text: string; link: string };
  order: number;
}

export type HeroTransition = 'fade' | 'slide' | 'slide-up' | 'slide-down' | 'zoom' | 'blur' | 'none';

export interface HeroSliderConfig {
  slides: HeroSlide[];
  speed: number;
  transition: HeroTransition;
  transitionDuration: number;
  autoplay: boolean;
  loop: boolean;
  pauseOnHover: boolean;
  showArrows: boolean;
  showDots: boolean;
  kenBurns: boolean;
  mobileImageFirst: boolean;
  contentAlignment: 'left' | 'center';
}

// Chatbot
export interface ChatbotWhatsAppGroup {
  id: string;
  name: string;
  link: string;
  description?: string;
}

export interface ChatbotResource {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ChatbotConfig {
  enabled: boolean;
  assistantName?: string;
  greetingMessage: string;
  systemPrompt: string;
  persona: string;
  knowledgeSnippets: { id: string; question: string; answer: string }[];
  whatsappGroups: ChatbotWhatsAppGroup[];
  resources: ChatbotResource[];
  sharePhone?: string;
  shareEmail?: string;
  shareAddress?: string;
  collectLeadInfo: boolean;
  leadPromptMessage?: string;
  updatedAt: number;
}

export interface ChatLead {
  id: string;
  sessionId: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  source: 'chatbot';
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Homepage content
export type HomeFeatureIcon = 'globe' | 'calendar' | 'users' | 'zap' | 'star' | 'heart' | 'shield' | 'target';

export interface HomeFeatureCard {
  id: string;
  icon: HomeFeatureIcon;
  title: string;
  description: string;
  order: number;
}

export interface PartnerLogo {
  id: string;
  name: string;
  logoUrl: string;
  url?: string;
  order: number;
}

export type PartnersMarqueeDirection = 'left' | 'right';
export type PartnersMarqueeEasing = 'linear' | 'ease' | 'ease-in-out';

export interface HomePartnersSection {
  enabled: boolean;
  title: string;
  /** Seconds for one full marquee loop (lower = faster) */
  speed: number;
  /** Scroll direction */
  direction: PartnersMarqueeDirection;
  /** CSS animation timing function */
  easing: PartnersMarqueeEasing;
  /** Pause animation when hovering the track */
  pauseOnHover: boolean;
  /** Soft grayscale logos until hover */
  grayscale: boolean;
  /** Fade edges on left/right of the strip */
  showEdgeFade: boolean;
  /** Horizontal gap between logos in px */
  gap: number;
  /** Logo height in px (desktop; mobile scales down slightly) */
  logoHeight: number;
  partners: PartnerLogo[];
}

export interface HomePageContent {
  eventsSection: {
    title: string;
    subtitle: string;
    linkText: string;
    emptyMessage: string;
  };
  featuresSection: {
    title: string;
    subtitle: string;
    cards: HomeFeatureCard[];
  };
  partnersSection: HomePartnersSection;
  ctaSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
  };
  updatedAt: number;
}

// Settings type
export interface BrandingConfig {
  logoUrl?: string;
  logoUrlDark?: string;
  /** Site favicon / browser tab icon URL */
  faviconUrl?: string;
  footerTagline?: string;
  copyrightText?: string;
  /** Founder name used as email signature */
  founderName?: string;
  /** Warm welcome message after email verification */
  founderWelcomeMessage?: string;
}

export interface Settings {
  id: string;
  siteName: string;
  description: string;
  contactEmail: string;
  phone?: string;
  address?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    tiktok?: string;
    youtube?: string;
    telegram?: string;
    email?: string;
  };
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  integrations: {
    stripe?: { publishableKey?: string; secretKey?: string; webhookSecret?: string; configured: boolean };
    sendgrid?: { apiKey?: string; configured: boolean };
    googlePlaces?: { apiKey?: string; configured: boolean };
    whatsapp?: { phoneNumber?: string; configured: boolean };
    youtube?: { apiKey?: string; channelId?: string; configured: boolean };
    anthropic?: { apiKey?: string; configured: boolean };
    firebaseAdmin?: {
      projectId?: string;
      clientEmail?: string;
      privateKey?: string;
      configured: boolean;
    };
    firebaseClient?: {
      apiKey?: string;
      authDomain?: string;
      projectId?: string;
      storageBucket?: string;
      messagingSenderId?: string;
      appId?: string;
      configured: boolean;
    };
    gmailSmtp?: {
      host?: string;
      port?: number;
      user?: string;
      password?: string;
      fromEmail?: string;
      fromName?: string;
      configured: boolean;
    };
    fcm?: {
      vapidKey?: string;
      serverKey?: string;
      enabled?: boolean;
      configured: boolean;
    };
  };
  languages: string[];
  defaultLanguage: string;
  theme: 'light' | 'dark' | 'system';
  heroSlider?: HeroSlide[];
  heroSliderConfig?: HeroSliderConfig;
  youtubeSection?: {
    enabled: boolean;
    title?: string;
    description?: string;
    videosPerPage?: number;
  };
  chatbot?: ChatbotConfig;
  aboutContent?: AboutPageContent;
  homePage?: HomePageContent;
  branding?: BrandingConfig;
  resourcesPage?: ResourcesPageContent;
  careersPage?: CareersPageContent;
  pressPage?: PressPageContent;
  legalPages?: LegalPagesContent;
  updatedAt: number;
  updatedBy: string;
}
