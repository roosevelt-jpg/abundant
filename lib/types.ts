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
    googlePlaces?: { configured: boolean };
    whatsapp?: { phoneNumber?: string; configured: boolean };
    youtube?: { apiKey?: string; channelId?: string; configured: boolean };
  };
  languages: string[];
  defaultLanguage: string;
  theme: 'light' | 'dark' | 'system';
  heroSlider?: Array<{
    id?: string;
    image: string;
    title: string;
    subtitle?: string;
    cta?: { text?: string; link?: string };
    order?: number;
  }>;
  youtubeSection?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    videosPerPage?: number;
  };
  updatedAt: number;
  updatedBy: string;
}
