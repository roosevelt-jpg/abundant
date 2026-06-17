import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { Page, Settings, User } from '@/lib/types';

// Pages CRUD
export const pagesRef = collection(db, 'pages');

export async function getPage(id: string): Promise<Page | null> {
  try {
    const docSnap = await getDoc(doc(pagesRef, id));
    return docSnap.exists() ? (docSnap.data() as Page) : null;
  } catch (error) {
    console.error('Error getting page:', error);
    return null;
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const q = query(pagesRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : (querySnapshot.docs[0].data() as Page);
  } catch (error) {
    console.error('Error getting page by slug:', error);
    return null;
  }
}

export async function getAllPages(): Promise<Page[]> {
  try {
    const querySnapshot = await getDocs(pagesRef);
    return querySnapshot.docs.map(doc => doc.data() as Page);
  } catch (error) {
    console.error('Error getting all pages:', error);
    return [];
  }
}

export async function createPage(page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const newPage: Page = {
      ...page,
      id: doc(pagesRef).id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await setDoc(doc(pagesRef, newPage.id), newPage);
    return newPage.id;
  } catch (error) {
    console.error('Error creating page:', error);
    throw error;
  }
}

export async function updatePage(id: string, updates: Partial<Page>): Promise<void> {
  try {
    await updateDoc(doc(pagesRef, id), {
      ...updates,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating page:', error);
    throw error;
  }
}

export async function deletePage(id: string): Promise<void> {
  try {
    await deleteDoc(doc(pagesRef, id));
  } catch (error) {
    console.error('Error deleting page:', error);
    throw error;
  }
}

// Settings CRUD
export const settingsRef = collection(db, 'settings');
const DEFAULT_SETTINGS_ID = 'main';

export async function getSettings(): Promise<Settings | null> {
  try {
    const docSnap = await getDoc(doc(settingsRef, DEFAULT_SETTINGS_ID));
    return docSnap.exists() ? (docSnap.data() as Settings) : null;
  } catch (error) {
    console.error('Error getting settings:', error);
    return null;
  }
}

export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  try {
    const settingsDoc = doc(settingsRef, DEFAULT_SETTINGS_ID);
    const existing = await getDoc(settingsDoc);
    
    if (existing.exists()) {
      await updateDoc(settingsDoc, {
        ...updates,
        updatedAt: Date.now()
      });
    } else {
      await setDoc(settingsDoc, {
        id: DEFAULT_SETTINGS_ID,
        ...updates,
        updatedAt: Date.now(),
        updatedBy: 'system'
      } as Settings);
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

export async function initializeSettings(): Promise<Settings> {
  try {
    const existing = await getSettings();
    if (existing) return existing;

    const defaultSettings: Settings = {
      id: DEFAULT_SETTINGS_ID,
      siteName: 'Abundant Global Club',
      description: 'A Global Network of Success',
      contactEmail: 'hello@abundant.club',
      phone: '+1 (234) 567-890',
      address: 'Dubai, UAE',
      socialLinks: {
        twitter: 'https://twitter.com/abundant',
        linkedin: 'https://linkedin.com/company/abundant',
        instagram: 'https://instagram.com/abundant'
      },
      colors: {
        primary: '#0F1B2E',
        secondary: '#B8973A',
        accent: '#D4AF87'
      },
      integrations: {
        stripe: { publishableKey: '', configured: false },
        sendgrid: { configured: false },
        googlePlaces: { configured: false },
        whatsapp: { phoneNumber: '', configured: false }
      },
      languages: ['en', 'ar'],
      defaultLanguage: 'en',
      theme: 'dark',
      heroSlider: {
        enabled: true,
        speed: 5000,
        transition: 'fade',
        autoPlay: true,
        slides: []
      },
      youtubeSection: {
        enabled: false,
        title: 'Featured Videos',
        description: 'Watch our latest content'
      },
      updatedAt: Date.now(),
      updatedBy: 'system'
    };

    await setDoc(doc(settingsRef, DEFAULT_SETTINGS_ID), defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('Error initializing settings:', error);
    throw error;
  }
}

// User Profile Management
export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? (userSnap.data() as User) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}
