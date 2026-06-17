import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Testimonial, Event, Page, Settings, User } from './types';

// ========== TESTIMONIALS ==========

export async function getTestimonials() {
  try {
    const q = query(
      collection(db, 'testimonials'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Testimonial));
  } catch (error) {
    console.error('[v0] Error fetching testimonials:', error);
    throw error;
  }
}

export async function addTestimonial(data: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'testimonials'), {
      ...data,
      createdAt: Timestamp.now().toMillis(),
      updatedAt: Timestamp.now().toMillis(),
    });
    return docRef.id;
  } catch (error) {
    console.error('[v0] Error adding testimonial:', error);
    throw error;
  }
}

export async function updateTestimonial(id: string, data: Partial<Testimonial>) {
  try {
    const ref = doc(db, 'testimonials', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now().toMillis(),
    });
  } catch (error) {
    console.error('[v0] Error updating testimonial:', error);
    throw error;
  }
}

export async function deleteTestimonial(id: string) {
  try {
    await deleteDoc(doc(db, 'testimonials', id));
  } catch (error) {
    console.error('[v0] Error deleting testimonial:', error);
    throw error;
  }
}

export async function publishTestimonial(id: string, isPublished: boolean) {
  try {
    await updateTestimonial(id, { isPublished });
  } catch (error) {
    console.error('[v0] Error publishing testimonial:', error);
    throw error;
  }
}

// ========== EVENTS ==========

export async function getEvents() {
  try {
    const q = query(
      collection(db, 'events'),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Event));
  } catch (error) {
    console.error('[v0] Error fetching events:', error);
    throw error;
  }
}

export async function getPublicEvents() {
  try {
    const q = query(
      collection(db, 'events'),
      where('isPublic', '==', true),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Event));
  } catch (error) {
    console.error('[v0] Error fetching public events:', error);
    throw error;
  }
}

export async function getEvent(id: string) {
  try {
    const ref = doc(db, 'events', id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { ...snapshot.data(), id: snapshot.id } as Event;
  } catch (error) {
    console.error('[v0] Error fetching event:', error);
    throw error;
  }
}

export async function addEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'events'), {
      ...data,
      createdAt: Timestamp.now().toMillis(),
      updatedAt: Timestamp.now().toMillis(),
    });
    return docRef.id;
  } catch (error) {
    console.error('[v0] Error adding event:', error);
    throw error;
  }
}

export async function updateEvent(id: string, data: Partial<Event>) {
  try {
    const ref = doc(db, 'events', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now().toMillis(),
    });
  } catch (error) {
    console.error('[v0] Error updating event:', error);
    throw error;
  }
}

export async function deleteEvent(id: string) {
  try {
    await deleteDoc(doc(db, 'events', id));
  } catch (error) {
    console.error('[v0] Error deleting event:', error);
    throw error;
  }
}

// ========== MEMBERS ==========

export async function getMembers() {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'member'),
      orderBy('joinedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
  } catch (error) {
    console.error('[v0] Error fetching members:', error);
    throw error;
  }
}

export async function getMember(uid: string) {
  try {
    const ref = doc(db, 'users', uid);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { ...snapshot.data(), uid: snapshot.id } as User;
  } catch (error) {
    console.error('[v0] Error fetching member:', error);
    throw error;
  }
}

export async function updateMember(uid: string, data: Partial<User>) {
  try {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now().toMillis(),
    });
  } catch (error) {
    console.error('[v0] Error updating member:', error);
    throw error;
  }
}

export async function deleteMember(uid: string) {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    console.error('[v0] Error deleting member:', error);
    throw error;
  }
}

// ========== PAGES ==========

export async function getPages() {
  try {
    const q = query(
      collection(db, 'pages'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Page));
  } catch (error) {
    console.error('[v0] Error fetching pages:', error);
    throw error;
  }
}

export async function getPublishedPages() {
  try {
    const q = query(
      collection(db, 'pages'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Page));
  } catch (error) {
    console.error('[v0] Error fetching published pages:', error);
    throw error;
  }
}

export async function getPageBySlug(slug: string) {
  try {
    const q = query(
      collection(db, 'pages'),
      where('slug', '==', slug),
      where('isPublished', '==', true)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { ...doc.data(), id: doc.id } as Page;
  } catch (error) {
    console.error('[v0] Error fetching page by slug:', error);
    throw error;
  }
}

export async function getPage(id: string) {
  try {
    const ref = doc(db, 'pages', id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { ...snapshot.data(), id: snapshot.id } as Page;
  } catch (error) {
    console.error('[v0] Error fetching page:', error);
    throw error;
  }
}

export async function addPage(data: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>, userId: string) {
  try {
    const docRef = await addDoc(collection(db, 'pages'), {
      ...data,
      createdBy: userId,
      createdAt: Timestamp.now().toMillis(),
      updatedAt: Timestamp.now().toMillis(),
    });
    return docRef.id;
  } catch (error) {
    console.error('[v0] Error adding page:', error);
    throw error;
  }
}

export async function updatePage(id: string, data: Partial<Page>) {
  try {
    const ref = doc(db, 'pages', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now().toMillis(),
    });
  } catch (error) {
    console.error('[v0] Error updating page:', error);
    throw error;
  }
}

export async function deletePage(id: string) {
  try {
    await deleteDoc(doc(db, 'pages', id));
  } catch (error) {
    console.error('[v0] Error deleting page:', error);
    throw error;
  }
}

// ========== SETTINGS ==========

export async function getSettings(): Promise<Settings | null> {
  try {
    const ref = doc(db, 'settings', 'site');
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { ...snapshot.data() } as Settings;
  } catch (error) {
    console.error('[v0] Error fetching settings:', error);
    throw error;
  }
}

export async function updateSettings(data: Partial<Settings>, userId: string) {
  try {
    const ref = doc(db, 'settings', 'site');
    const snapshot = await getDoc(ref);
    
    if (!snapshot.exists()) {
      // Create settings if it doesn't exist
      await updateDoc(ref, {
        ...data,
        id: 'site',
        updatedAt: Timestamp.now().toMillis(),
        updatedBy: userId,
      });
    } else {
      await updateDoc(ref, {
        ...data,
        updatedAt: Timestamp.now().toMillis(),
        updatedBy: userId,
      });
    }
  } catch (error) {
    console.error('[v0] Error updating settings:', error);
    throw error;
  }
}

// ========== BATCH OPERATIONS ==========

export async function publishMultipleTestimonials(ids: string[]) {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const ref = doc(db, 'testimonials', id);
      batch.update(ref, { isPublished: true, updatedAt: Timestamp.now().toMillis() });
    });
    await batch.commit();
  } catch (error) {
    console.error('[v0] Error publishing testimonials:', error);
    throw error;
  }
}

export async function unpublishMultipleTestimonials(ids: string[]) {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const ref = doc(db, 'testimonials', id);
      batch.update(ref, { isPublished: false, updatedAt: Timestamp.now().toMillis() });
    });
    await batch.commit();
  } catch (error) {
    console.error('[v0] Error unpublishing testimonials:', error);
    throw error;
  }
}
