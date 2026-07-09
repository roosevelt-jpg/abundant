// User types for Firestore
export type UserRole = 'member' | 'admin' | 'super_admin';

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
  | 'invites'
  | 'settings';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  permissions?: AdminPermission[];
  membershipTier: 'member' | 'elite' | 'inner-circle';
  joinedAt: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: number;
  updatedAt: number;
  phone?: string;
  bio?: string;
  title?: string;
  country?: string;
  nationality?: string;
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
}

export interface MemberProfile {
  country?: string;
  nationality?: string;
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

export interface Event {
  id: string;
  title: string;
  description: string;
  date: number;
  endDate?: number;
  location: string;
  virtualLink?: string;
  capacity?: number;
  registered: number;
  imageUrl?: string;
  category: 'networking' | 'workshop' | 'webinar' | 'conference' | 'other';
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isPublic: boolean;
  pricingType: 'free' | 'paid';
  price?: number;
  currency?: string;
  stripePriceId?: string;
  audienceGender?: EventAudienceGender;
  tags?: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  attendees?: string[];
  agenda?: { time: string; title: string; speaker?: string }[];
  speakers?: { name: string; title?: string; bio?: string; image?: string }[];
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  registeredAt: number;
  status: 'registered' | 'attended' | 'cancelled';
  paymentStatus?: 'free' | 'paid' | 'pending' | 'failed';
  stripePaymentId?: string;
  amountPaid?: number;
  discountCode?: string;
  discountAmount?: number;
  checkInTime?: number;
}

// Membership plans
export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  benefits: string[];
  tier: 'member' | 'elite' | 'inner-circle';
  stripePriceId?: string;
  stripeProductId?: string;
  active: boolean;
  order: number;
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

export interface HeroSliderConfig {
  slides: HeroSlide[];
  speed: number;
  transition: 'fade' | 'slide' | 'none';
  autoplay: boolean;
  loop: boolean;
  pauseOnHover: boolean;
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
  footerTagline?: string;
  copyrightText?: string;
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
  updatedAt: number;
  updatedBy: string;
}
