import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { CustomForm, FormSubmission } from '@/lib/types';

function db() {
  return getDb();
}

const formsRef = () => collection(db(), 'customForms');
const submissionsRef = () => collection(db(), 'formSubmissions');

export async function getAllForms(): Promise<CustomForm[]> {
  const snap = await getDocs(formsRef());
  return snap.docs.map((d) => d.data() as CustomForm);
}

export async function getFormByPlacement(placement: string): Promise<CustomForm | null> {
  const q = query(formsRef(), where('placement', '==', placement), where('active', '==', true));
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as CustomForm);
}

export async function createForm(form: Omit<CustomForm, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const newForm: CustomForm = {
    ...form,
    id: doc(formsRef()).id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(formsRef(), newForm.id), newForm);
  return newForm.id;
}

export async function updateForm(id: string, updates: Partial<CustomForm>): Promise<void> {
  await updateDoc(doc(formsRef(), id), { ...updates, updatedAt: Date.now() });
}

export async function deleteForm(id: string): Promise<void> {
  await deleteDoc(doc(formsRef(), id));
}

export async function submitForm(
  formId: string,
  formName: string,
  data: Record<string, string>
): Promise<string> {
  const submission: FormSubmission = {
    id: doc(submissionsRef()).id,
    formId,
    formName,
    data,
    status: 'new',
    submittedAt: Date.now(),
  };
  await setDoc(doc(submissionsRef(), submission.id), submission);
  return submission.id;
}

export async function getFormSubmissions(formId?: string): Promise<FormSubmission[]> {
  const q = formId
    ? query(submissionsRef(), where('formId', '==', formId), orderBy('submittedAt', 'desc'))
    : query(submissionsRef(), orderBy('submittedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FormSubmission);
}

export async function updateFormSubmission(id: string, updates: Partial<FormSubmission>): Promise<void> {
  await updateDoc(doc(submissionsRef(), id), updates);
}
