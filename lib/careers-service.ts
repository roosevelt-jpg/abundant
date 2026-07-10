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
import { JobApplication, JobPosting } from '@/lib/types';

function jobsRef() {
  return collection(getDb(), 'jobPostings');
}

function applicationsRef() {
  return collection(getDb(), 'jobApplications');
}

export async function getAllJobPostings(): Promise<JobPosting[]> {
  const q = query(jobsRef(), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as JobPosting);
}

export async function createJobPosting(
  data: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<string> {
  const existing = await getAllJobPostings();
  const item: JobPosting = {
    ...data,
    id: doc(jobsRef()).id,
    order: existing.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(jobsRef(), item.id), item);
  return item.id;
}

export async function updateJobPosting(id: string, updates: Partial<JobPosting>): Promise<void> {
  await updateDoc(doc(jobsRef(), id), { ...updates, updatedAt: Date.now() });
}

export async function deleteJobPosting(id: string): Promise<void> {
  await deleteDoc(doc(jobsRef(), id));
}

export async function reorderJobPostings(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      updateDoc(doc(jobsRef(), id), { order: index, updatedAt: Date.now() })
    )
  );
}

export async function getAllJobApplications(): Promise<JobApplication[]> {
  const snap = await getDocs(applicationsRef());
  return snap.docs
    .map((d) => d.data() as JobApplication)
    .sort((a, b) => b.submittedAt - a.submittedAt);
}

export async function updateJobApplication(
  id: string,
  updates: Partial<JobApplication>
): Promise<void> {
  await updateDoc(doc(applicationsRef(), id), updates);
}
