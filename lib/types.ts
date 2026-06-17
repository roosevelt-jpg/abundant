// User types for Firestore
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'member' | 'admin';
  membershipTier: 'member' | 'elite' | 'inner-circle';
  joinedAt: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: number;
  updatedAt: number;
}

// Event types for Firestore
export interface Event {
  id: string;
  title: string;
  description: string;
  date: number; // timestamp
  endDate?: number;
  location: string;
  capacity?: number;
  registered: number;
  imageUrl?: string;
  category: 'networking' | 'workshop' | 'webinar' | 'conference' | 'other';
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isPublic: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  attendees?: string[]; // user IDs
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
  checkInTime?: number;
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
  isPublished: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
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
  };
  languages: string[];
  defaultLanguage: string;
  theme: 'light' | 'dark' | 'system';
  heroSlider?: Array<{
    image: string;
    title: string;
    subtitle?: string;
    cta?: { text: string; link: string };
  }>;
  youtubeSection?: {
    enabled: boolean;
    title?: string;
    description?: string;
  };
  updatedAt: number;
  updatedBy: string;
}
