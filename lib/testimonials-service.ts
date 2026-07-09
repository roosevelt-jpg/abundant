import { getDb } from '@/lib/firebase';

function db() {
  return getDb();
}
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { Testimonial } from '@/lib/types';

export const testimonialsRef = () => collection(db(), 'testimonials');

// Get all testimonials
export async function getAllTestimonials(): Promise<Testimonial[]> {
  try {
    const q = query(testimonialsRef(), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Testimonial);
  } catch (error) {
    console.error('Error getting all testimonials:', error);
    return [];
  }
}

// Get published testimonials
export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  try {
    const q = query(
      testimonialsRef(),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Testimonial);
  } catch (error) {
    console.error('Error getting published testimonials:', error);
    return [];
  }
}

// Get testimonials for specific event
export async function getEventTestimonials(eventId: string): Promise<Testimonial[]> {
  try {
    const q = query(
      testimonialsRef(),
      where('eventId', '==', eventId),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Testimonial);
  } catch (error) {
    console.error('Error getting event testimonials:', error);
    return [];
  }
}

// Get single testimonial
export async function getTestimonial(id: string): Promise<Testimonial | null> {
  try {
    const docSnap = await getDoc(doc(testimonialsRef(), id));
    return docSnap.exists() ? (docSnap.data() as Testimonial) : null;
  } catch (error) {
    console.error('Error getting testimonial:', error);
    return null;
  }
}

// Create testimonial
export async function createTestimonial(testimonial: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const newTestimonial: Testimonial = {
      ...testimonial,
      id: doc(testimonialsRef()).id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await setDoc(doc(testimonialsRef(), newTestimonial.id), newTestimonial);
    return newTestimonial.id;
  } catch (error) {
    console.error('Error creating testimonial:', error);
    throw error;
  }
}

// Update testimonial
export async function updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<void> {
  try {
    await updateDoc(doc(testimonialsRef(), id), {
      ...updates,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    throw error;
  }
}

// Delete testimonial
export async function deleteTestimonial(id: string): Promise<void> {
  try {
    await deleteDoc(doc(testimonialsRef(), id));
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    throw error;
  }
}

// Publish/unpublish testimonial
export async function publishTestimonial(id: string, isPublished: boolean): Promise<void> {
  try {
    await updateTestimonial(id, { isPublished });
  } catch (error) {
    console.error('Error publishing testimonial:', error);
    throw error;
  }
}
