'use client';

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

export async function getPage(id: string): Promise<Page | null> {
  try {
    const pagesRef = collection(db, 'pages');
    const docSnap = await getDoc(doc(pagesRef, id));
    return docSnap.exists() ? (docSnap.data() as Page) : null;
  } catch (error) {
    console.error('Error getting page:', error);
    return null;
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const pagesRef = collection(db, 'pages');
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
    const pagesRef = collection(db, 'pages');
    const querySnapshot = await getDocs(pagesRef);
    return querySnapshot.docs.map(doc => doc.data() as Page);
  } catch (error) {
    console.error('Error getting pages:', error);
    return [];
  }
}

export async function createPage(newPage: Omit<Page, 'id'>): Promise<Page> {
  try {
    const pagesRef = collection(db, 'pages');
    const pageWithMetadata: Page = {
      id: doc(pagesRef).id,
      ...newPage,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await setDoc(doc(pagesRef, pageWithMetadata.id), pageWithMetadata);
    return pageWithMetadata;
  } catch (error) {
    console.error('Error creating page:', error);
    throw error;
  }
}

export async function updatePage(id: string, updates: Partial<Page>): Promise<void> {
  try {
    const pagesRef = collection(db, 'pages');
    await updateDoc(doc(pagesRef, id), {
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating page:', error);
    throw error;
  }
}

export async function deletePage(id: string): Promise<void> {
  try {
    const pagesRef = collection(db, 'pages');
    await deleteDoc(doc(pagesRef, id));
  } catch (error) {
    console.error('Error deleting page:', error);
    throw error;
  }
}

// Settings CRUD - Now using firestore-admin-service for server-side operations

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
