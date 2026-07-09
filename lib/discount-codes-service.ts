import { getDb } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, orderBy, query } from 'firebase/firestore';
import { EventDiscountCode } from '@/lib/types';

function codesRef() {
  return collection(getDb(), 'eventDiscountCodes');
}

export async function getAllDiscountCodes(): Promise<EventDiscountCode[]> {
  try {
    const q = query(codesRef(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as EventDiscountCode);
  } catch {
    return [];
  }
}

export async function createDiscountCode(
  data: Omit<EventDiscountCode, 'id' | 'usedCount' | 'createdAt'>
): Promise<string> {
  const code: EventDiscountCode = {
    ...data,
    id: doc(codesRef()).id,
    code: data.code.trim().toUpperCase(),
    usedCount: 0,
    createdAt: Date.now(),
  };
  await setDoc(doc(codesRef(), code.id), code);
  return code.id;
}

export async function updateDiscountCode(id: string, updates: Partial<EventDiscountCode>): Promise<void> {
  const payload = { ...updates };
  if (payload.code) payload.code = payload.code.trim().toUpperCase();
  await updateDoc(doc(codesRef(), id), payload);
}

export async function deleteDiscountCode(id: string): Promise<void> {
  await deleteDoc(doc(codesRef(), id));
}
