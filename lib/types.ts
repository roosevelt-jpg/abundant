// User types for Firestore
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'member' | 'admin';
  membershipTier?: 'member' | 'elite' | 'inner-circle' | 'founder';
  membershipPlanId?: string;
  subscriptionStatus?: 'active' | 'inactive' | 'expired' | 'cancelled';
  subscriptionStartDate?: number;
  subscriptionEndDate?: number;
  joinedAt?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'suspended';
  createdAt?: number;
  updatedAt?: number;
  phone?: string;
  bio?: string;
  title?: string;
}

// Event types for Firestore
export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string for form input
  time?: string; // HH:mm format
  location?: string;
  expectedAttendees?: number;
  price?: number;
  stripeProductId?: string;
  isPublic: boolean;
  imageUrl?: string;
  category?: 'networking' | 'workshop' | 'webinar' | 'conference' | 'other';
  eventType?: 'in-person' | 'online' | 'hybrid';
  registrationType?: 'free' | 'paid' | 'rsvp';
  genderRestriction?: 'mixed' | 'men-only' | 'women-only';
  status?: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
  attendees?: string[];
  registrations?: number;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  registeredAt: number;
  status: 'registered' | 'attended' | 'cancelled';
  checkInTime?: number;
}

// Membership Plan types for Firestore
export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'annual';
  features: string[];
  maxEventRegistrations?: number;
  prioritySupport: boolean;
  accessLevel: number; // 1 = member, 2 = elite, 3 = inner-circle, 4 = founder
  stripeProductId?: string;
  stripePriceId?: string;
  isPublic: boolean;
  status: 'draft' | 'active' | 'discontinued';
  order: number; // Display order
  color?: string;
  badge?: string;
  isMostPopular?: boolean;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
  subscribers?: number;
}

// Testimonial types
export interface Testimonial {
  id: string;
  authorName: string;
  authorTitle?: string;
  authorImage?: string;
  content: string;
  rating: number; // 1-5
  eventId?: string;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

// CMS Page type
export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  displayLocation?: 'custom' | 'footer' | 'navigation' | 'both';
  isPublished: boolean;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
}

// Content Page type - for managing About pages and related content
export interface ContentPage {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  content?: string;
  heroImage?: string;
  navLabel: string; // Label shown in navigation dropdown
  category: 'about' | 'what-we-do' | 'why-agc' | 'leadership' | 'careers' | 'custom';
  order: number;
  isPublished: boolean;
  sections?: ContentSection[];
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
}

// Content section for rich content building
export interface ContentSection {
  id: string;
  type: 'hero' | 'text' | 'cards' | 'gallery' | 'features' | 'testimonials' | 'cta';
  title?: string;
  subtitle?: string;
  content?: string;
  image?: string;
  items?: ContentItem[];
  order: number;
  backgroundColor?: string;
  textAlignment?: 'left' | 'center' | 'right';
}

export interface ContentItem {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  image?: string;
  content?: string;
  link?: string;
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
    stripe?: { publishableKey?: string; configured: boolean };
    sendgrid?: { configured: boolean };
    googlePlaces?: { apiKey?: string; configured: boolean };
    whatsapp?: { phoneNumber?: string; configured: boolean };
    youtube?: { apiKey?: string; channelId?: string; configured: boolean };
  };
  languages: string[];
  defaultLanguage: string;
  theme: 'light' | 'dark' | 'system';
  heroSlider?: {
    enabled?: boolean;
    speed?: number; // milliseconds (3000, 5000, 10000, etc)
    transition?: 'fade' | 'slide'; // fade or slide animation
    autoPlay?: boolean;
    slides: Array<{
      id?: string;
      type: 'image' | 'video'; // image or video
      url: string; // URL to image or video (Firestore storage URL)
      title?: string;
      subtitle?: string;
      cta?: { text?: string; link?: string };
      order?: number;
    }>;
  };
  youtubeSection?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    videosPerPage?: number;
  };
  logos?: {
    header?: string; // URL to header logo image stored in Firestore
    footer?: string; // URL to footer logo image
    login?: string; // URL to login page logo
  };
  updatedAt: number;
  updatedBy: string;
}
