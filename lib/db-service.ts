import { getDb } from '@/lib/firebase';
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
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { Page, Settings } from '@/lib/types';
import { SETTINGS_DOC_ID } from '@/lib/constants';

function db() {
  return getDb();
}

// Pages CRUD
export const pagesRef = () => collection(db(), 'pages');

export async function getPage(id: string): Promise<Page | null> {
  try {
    const docSnap = await getDoc(doc(pagesRef(), id));
    return docSnap.exists() ? (docSnap.data() as Page) : null;
  } catch (error) {
    console.error('Error getting page:', error);
    throw error;
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const q = query(pagesRef(), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : (querySnapshot.docs[0].data() as Page);
  } catch (error) {
    console.error('Error getting page by slug:', error);
    throw error;
  }
}

export async function getAllPages(): Promise<Page[]> {
  try {
    const querySnapshot = await getDocs(pagesRef());
    return querySnapshot.docs.map((d) => d.data() as Page);
  } catch (error) {
    console.error('Error getting all pages:', error);
    throw error;
  }
}

export async function getPublishedPages(): Promise<Page[]> {
  try {
    const q = query(pagesRef(), where('isPublished', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => d.data() as Page);
  } catch (error) {
    console.error('Error getting published pages:', error);
    throw error;
  }
}

export async function createPage(page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const newPage: Page = {
    ...page,
    id: doc(pagesRef()).id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(pagesRef(), newPage.id), newPage);
  return newPage.id;
}

export async function updatePage(id: string, updates: Partial<Page>): Promise<void> {
  await updateDoc(doc(pagesRef(), id), {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deletePage(id: string): Promise<void> {
  await deleteDoc(doc(pagesRef(), id));
}

// Settings
export const settingsRef = () => collection(db(), 'settings');

export function getDefaultSettings(): Settings {
  return {
    id: SETTINGS_DOC_ID,
    siteName: 'Abundant Global Club',
    description: 'A Global Network of Success',
    contactEmail: 'hello@abundant.club',
    phone: '+1 (234) 567-890',
    address: 'Dubai, UAE',
    socialLinks: {
      twitter: 'https://twitter.com/abundant',
      linkedin: 'https://linkedin.com/company/abundant',
      instagram: 'https://instagram.com/abundant',
      whatsapp: '+1234567890',
    },
    colors: {
      primary: '#0F1B2E',
      secondary: '#B8973A',
      accent: '#D4AF87',
    },
    integrations: {
      stripe: { publishableKey: '', configured: false },
      sendgrid: { configured: false },
      googlePlaces: { configured: false },
      whatsapp: { phoneNumber: '+1234567890', configured: true },
      youtube: { configured: false },
      anthropic: { configured: false },
    },
    languages: ['en', 'ar'],
    defaultLanguage: 'en',
    theme: 'dark',
    heroSlider: [],
    heroSliderConfig: {
      slides: [],
      speed: 5000,
      transition: 'fade',
      autoplay: true,
      loop: true,
      pauseOnHover: true,
    },
    youtubeSection: {
      enabled: false,
      title: 'Featured Videos',
      description: 'Watch our latest content',
      videosPerPage: 3,
    },
    branding: {
      footerTagline: 'A global network of success',
      copyrightText: `© ${new Date().getFullYear()} Abundant Global Club. All rights reserved.`,
      creditName: 'FLYN.AI',
      creditUrl: 'https://myflynai.com/',
    },
    chatbot: {
      enabled: false,
      systemPrompt: 'You are a helpful assistant for Abundant Global Club.',
      persona: 'Professional and welcoming',
      knowledgeSnippets: [],
      updatedAt: Date.now(),
    },
    aboutContent: {
      coreValues: [],
      teamMembers: [],
      updatedAt: Date.now(),
    },
    updatedAt: Date.now(),
    updatedBy: 'system',
  };
}

export async function getSettings(): Promise<Settings | null> {
  const docSnap = await getDoc(doc(settingsRef(), SETTINGS_DOC_ID));
  return docSnap.exists() ? (docSnap.data() as Settings) : null;
}

export async function initializeSettings(updatedBy = 'system'): Promise<Settings> {
  const existing = await getSettings();
  if (existing) return existing;

  const defaultSettings = { ...getDefaultSettings(), updatedBy };
  await setDoc(doc(settingsRef(), SETTINGS_DOC_ID), defaultSettings);
  return defaultSettings;
}

export async function updateSettings(updates: Partial<Settings>, updatedBy = 'admin'): Promise<void> {
  const settingsDoc = doc(settingsRef(), SETTINGS_DOC_ID);
  const existing = await getDoc(settingsDoc);

  if (existing.exists()) {
    await updateDoc(settingsDoc, {
      ...updates,
      updatedAt: Date.now(),
      updatedBy,
    });
  } else {
    await setDoc(settingsDoc, {
      ...getDefaultSettings(),
      ...updates,
      id: SETTINGS_DOC_ID,
      updatedAt: Date.now(),
      updatedBy,
    });
  }
}

export function subscribeToSettings(
  onData: (settings: Settings) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(settingsRef(), SETTINGS_DOC_ID),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as Settings);
      }
    },
    (error) => onError(error)
  );
}

// User Profile Management
export async function updateUserProfile(userId: string, updates: Partial<import('@/lib/types').User>): Promise<void> {
  const userRef = doc(db(), 'users', userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function getUserProfile(userId: string): Promise<import('@/lib/types').User | null> {
  const userRef = doc(db(), 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? (userSnap.data() as import('@/lib/types').User) : null;
}

export async function getAllMembers(): Promise<import('@/lib/types').User[]> {
  const q = query(collection(db(), 'users'), where('role', '==', 'member'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as import('@/lib/types').User);
}
