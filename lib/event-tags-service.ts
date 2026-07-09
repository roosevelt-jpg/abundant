import { getDb } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, orderBy, query } from 'firebase/firestore';
import { EventTag } from '@/lib/types';

const DEFAULT_TAGS = ['Free', 'Premium', 'RSVP', 'Exclusive', 'High End'];

function tagsRef() {
  return collection(getDb(), 'eventTags');
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function getAllEventTags(): Promise<EventTag[]> {
  try {
    const q = query(tagsRef(), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as EventTag);
  } catch {
    return [];
  }
}

export async function seedDefaultEventTags(): Promise<void> {
  const existing = await getAllEventTags();
  if (existing.length > 0) return;

  const colors = ['#22c55e', '#B8973A', '#3b82f6', '#a855f7', '#ef4444'];
  await Promise.all(
    DEFAULT_TAGS.map((name, i) => {
      const tag: EventTag = {
        id: doc(tagsRef()).id,
        name,
        slug: slugify(name),
        color: colors[i % colors.length],
        order: i,
        active: true,
        createdAt: Date.now(),
      };
      return setDoc(doc(tagsRef(), tag.id), tag);
    })
  );
}

export async function createEventTag(name: string, color?: string): Promise<string> {
  const existing = await getAllEventTags();
  const tag: EventTag = {
    id: doc(tagsRef()).id,
    name: name.trim(),
    slug: slugify(name),
    color: color || '#B8973A',
    order: existing.length,
    active: true,
    createdAt: Date.now(),
  };
  await setDoc(doc(tagsRef(), tag.id), tag);
  return tag.id;
}

export async function updateEventTag(id: string, updates: Partial<EventTag>): Promise<void> {
  await updateDoc(doc(tagsRef(), id), updates);
}

export async function deleteEventTag(id: string): Promise<void> {
  await deleteDoc(doc(tagsRef(), id));
}
