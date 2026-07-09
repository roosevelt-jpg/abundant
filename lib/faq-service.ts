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
import { FaqItem } from '@/lib/types';

function faqsRef() {
  return collection(getDb(), 'faqs');
}

export async function getAllFaqs(): Promise<FaqItem[]> {
  const q = query(faqsRef(), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FaqItem);
}

export async function createFaq(
  data: Omit<FaqItem, 'id' | 'createdAt' | 'updatedAt' | 'order'>,
  createdBy?: string
): Promise<string> {
  const existing = await getAllFaqs();
  const faq: FaqItem = {
    ...data,
    id: doc(faqsRef()).id,
    order: existing.length,
    createdBy,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(faqsRef(), faq.id), faq);
  return faq.id;
}

export async function updateFaq(id: string, updates: Partial<FaqItem>): Promise<void> {
  await updateDoc(doc(faqsRef(), id), { ...updates, updatedAt: Date.now() });
}

export async function deleteFaq(id: string): Promise<void> {
  await deleteDoc(doc(faqsRef(), id));
}

export async function reorderFaqs(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) => updateDoc(doc(faqsRef(), id), { order: index, updatedAt: Date.now() }))
  );
}
