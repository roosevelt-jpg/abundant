'use server';

import { getDb } from '@/lib/firebase-admin-server';
import { MembershipPlan, Event, HeroSlide, YouTubeConfig } from '@/lib/types';

// Helper to get admin database
async function getAdminDb() {
  const db = await getDb();
  if (!db) {
    throw new Error('Admin database not initialized');
  }
  return db;
}

// MEMBERSHIP PLANS
export async function createMembershipPlan(plan: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const db = await getAdminDb();
    const docRef = db.collection('membershipPlans').doc();
    
    const newPlan: MembershipPlan = {
      ...plan,
      id: docRef.id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await docRef.set(newPlan);
    return { success: true, plan: newPlan };
  } catch (error) {
    console.error('[v0] Create membership plan error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create plan' };
  }
}

export async function updateMembershipPlan(id: string, updates: Partial<MembershipPlan>) {
  try {
    const db = await getAdminDb();
    
    await db.collection('membershipPlans').doc(id).update({
      ...updates,
      updatedAt: Date.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('[v0] Update membership plan error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update plan' };
  }
}

export async function deleteMembershipPlan(id: string) {
  try {
    const db = await getAdminDb();
    await db.collection('membershipPlans').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('[v0] Delete membership plan error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete plan' };
  }
}

// EVENTS
export async function createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const db = await getAdminDb();
    const docRef = db.collection('events').doc();
    
    const newEvent: Event = {
      ...event,
      id: docRef.id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await docRef.set(newEvent);
    return { success: true, event: newEvent };
  } catch (error) {
    console.error('[v0] Create event error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create event' };
  }
}

export async function updateEvent(id: string, updates: Partial<Event>) {
  try {
    const db = await getAdminDb();
    
    await db.collection('events').doc(id).update({
      ...updates,
      updatedAt: Date.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('[v0] Update event error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update event' };
  }
}

export async function deleteEvent(id: string) {
  try {
    const db = await getAdminDb();
    await db.collection('events').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('[v0] Delete event error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete event' };
  }
}

// HERO SLIDER
export async function updateHeroSlider(slides: HeroSlide[]) {
  try {
    const db = await getAdminDb();
    
    await db.collection('settings').doc('hero-slider').set({
      slides,
      updatedAt: Date.now()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('[v0] Update hero slider error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update slider' };
  }
}

// YOUTUBE CONFIG
export async function updateYouTubeConfig(config: YouTubeConfig) {
  try {
    const db = await getAdminDb();
    
    await db.collection('settings').doc('youtube').set({
      ...config,
      updatedAt: Date.now()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('[v0] Update YouTube config error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update YouTube config' };
  }
}
