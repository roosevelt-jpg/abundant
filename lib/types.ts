// User types for Firestore
export type UserRole = 'member' | 'admin' | 'super_admin';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
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
}

// Admin invite codes
export interface AdminInvite {
  id: string;
  code: string;
  role: 'admin' | 'super_admin';
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
  usedBy?: string;
  status: 'pending' | 'used' | 'expired' | 'revoked';
}

// Event types for Firestore
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

export interface AboutPageContent {
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
export interface ChatbotConfig {
  enabled: boolean;
  systemPrompt: string;
  persona: string;
  knowledgeSnippets: { id: string; question: string; answer: string }[];
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Settings type
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
  updatedAt: number;
  updatedBy: string;
}
