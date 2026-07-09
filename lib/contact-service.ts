import { getDb } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, query, orderBy } from 'firebase/firestore';
import { ContactSubmission } from '@/lib/types';

function db() {
  return getDb();
}

const submissionsRef = () => collection(db(), 'contactSubmissions');

export async function submitContactForm(
  data: Omit<ContactSubmission, 'id' | 'submittedAt' | 'status'>
): Promise<string> {
  const submission: ContactSubmission = {
    ...data,
    id: doc(submissionsRef()).id,
    status: 'new',
    submittedAt: Date.now(),
  };
  await setDoc(doc(submissionsRef(), submission.id), submission);
  return submission.id;
}

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  const q = query(submissionsRef(), orderBy('submittedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ContactSubmission);
}

export async function updateContactSubmission(
  id: string,
  updates: Partial<ContactSubmission>
): Promise<void> {
  await updateDoc(doc(submissionsRef(), id), updates);
}
