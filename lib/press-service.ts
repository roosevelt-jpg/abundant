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
import { PressItem } from '@/lib/types';

function pressRef() {
  return collection(getDb(), 'pressItems');
}

export async function getAllPressItems(): Promise<PressItem[]> {
  const q = query(pressRef(), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PressItem);
}

export async function createPressItem(
  data: Omit<PressItem, 'id' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<string> {
  const existing = await getAllPressItems();
  const item: PressItem = {
    ...data,
    id: doc(pressRef()).id,
    order: existing.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(pressRef(), item.id), item);
  return item.id;
}

export async function updatePressItem(id: string, updates: Partial<PressItem>): Promise<void> {
  await updateDoc(doc(pressRef(), id), { ...updates, updatedAt: Date.now() });
}

export async function deletePressItem(id: string): Promise<void> {
  await deleteDoc(doc(pressRef(), id));
}

export async function reorderPressItems(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      updateDoc(doc(pressRef(), id), { order: index, updatedAt: Date.now() })
    )
  );
}
