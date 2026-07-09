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
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { Event, EventRegistration } from '@/lib/types';

export const eventsRef = () => collection(db(), 'events');
export const registrationsRef = () => collection(db(), 'eventRegistrations');

// Event CRUD Operations
export async function getEvent(id: string): Promise<Event | null> {
  try {
    const docSnap = await getDoc(doc(eventsRef(), id));
    return docSnap.exists() ? (docSnap.data() as Event) : null;
  } catch (error) {
    console.error('Error getting event:', error);
    return null;
  }
}

export async function getAllEvents(): Promise<Event[]> {
  try {
    const q = query(eventsRef(), orderBy('date', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Event);
  } catch (error) {
    console.error('Error getting all events:', error);
    return [];
  }
}

export async function getUpcomingEvents(count: number = 10): Promise<Event[]> {
  try {
    const now = Date.now();
    const q = query(
      eventsRef(),
      where('date', '>=', now),
      where('isPublic', '==', true),
      orderBy('date', 'asc'),
      limit(count)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Event);
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return [];
  }
}

export async function createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registered'>): Promise<string> {
  try {
    const newEvent: Event = {
      ...event,
      id: doc(eventsRef()).id,
      registered: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await setDoc(doc(eventsRef(), newEvent.id), newEvent);
    return newEvent.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<void> {
  try {
    await updateDoc(doc(eventsRef(), id), {
      ...updates,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(eventsRef(), id));
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

// Event Registration Operations
export async function registerForEvent(registration: Omit<EventRegistration, 'id' | 'registeredAt'>): Promise<string> {
  try {
    const newReg: EventRegistration = {
      ...registration,
      id: doc(registrationsRef()).id,
      registeredAt: Date.now()
    };
    await setDoc(doc(registrationsRef(), newReg.id), newReg);
    
    // Update event registration count
    const event = await getEvent(registration.eventId);
    if (event) {
      await updateEvent(registration.eventId, {
        registered: (event.registered || 0) + 1
      });
    }
    
    return newReg.id;
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
}

export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  try {
    const q = query(registrationsRef(), where('eventId', '==', eventId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as EventRegistration);
  } catch (error) {
    console.error('Error getting event registrations:', error);
    return [];
  }
}

export async function getUserEventRegistrations(userId: string): Promise<EventRegistration[]> {
  try {
    const q = query(registrationsRef(), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as EventRegistration);
  } catch (error) {
    console.error('Error getting user event registrations:', error);
    return [];
  }
}

export async function checkInAttendee(registrationId: string): Promise<void> {
  try {
    await updateDoc(doc(registrationsRef(), registrationId), {
      status: 'attended',
      checkInTime: Date.now()
    });
  } catch (error) {
    console.error('Error checking in attendee:', error);
    throw error;
  }
}

export async function cancelEventRegistration(registrationId: string, eventId: string): Promise<void> {
  try {
    await updateDoc(doc(registrationsRef(), registrationId), {
      status: 'cancelled'
    });
    
    // Update event registration count
    const event = await getEvent(eventId);
    if (event) {
      await updateEvent(eventId, {
        registered: Math.max(0, (event.registered || 1) - 1)
      });
    }
  } catch (error) {
    console.error('Error cancelling registration:', error);
    throw error;
  }
}
