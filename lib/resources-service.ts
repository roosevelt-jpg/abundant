import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { ResourceItem } from '@/lib/types';

function resourcesRef() {
  return collection(getDb(), 'resources');
}

export async function getAllResources(): Promise<ResourceItem[]> {
  const q = query(resourcesRef(), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ResourceItem);
}

export async function createResource(
  data: Omit<ResourceItem, 'id' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<string> {
  const existing = await getAllResources();
  const item: ResourceItem = {
    ...data,
    id: doc(resourcesRef()).id,
    order: existing.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(resourcesRef(), item.id), item);
  return item.id;
}

export async function updateResource(id: string, updates: Partial<ResourceItem>): Promise<void> {
  await updateDoc(doc(resourcesRef(), id), { ...updates, updatedAt: Date.now() });
}

export async function deleteResource(id: string): Promise<void> {
  await deleteDoc(doc(resourcesRef(), id));
}

export async function reorderResources(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      updateDoc(doc(resourcesRef(), id), { order: index, updatedAt: Date.now() })
    )
  );
}
