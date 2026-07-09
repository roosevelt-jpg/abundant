import { getDb } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { MembershipPlan } from '@/lib/types';

function db() {
  return getDb();
}

const plansRef = () => collection(db(), 'membershipPlans');

export async function getAllPlans(): Promise<MembershipPlan[]> {
  const snap = await getDocs(plansRef());
  return snap.docs.map((d) => d.data() as MembershipPlan).sort((a, b) => a.order - b.order);
}

export async function getActivePlans(): Promise<MembershipPlan[]> {
  const q = query(plansRef(), where('active', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as MembershipPlan).sort((a, b) => a.order - b.order);
}

export async function createPlan(plan: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const newPlan: MembershipPlan = {
    ...plan,
    id: doc(plansRef()).id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(plansRef(), newPlan.id), newPlan);
  return newPlan.id;
}

export async function updatePlan(id: string, updates: Partial<MembershipPlan>): Promise<void> {
  await updateDoc(doc(plansRef(), id), { ...updates, updatedAt: Date.now() });
}

export async function deletePlan(id: string): Promise<void> {
  await deleteDoc(doc(plansRef(), id));
}
