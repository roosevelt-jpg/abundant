import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseServices } from '@/lib/firebase';

export async function uploadImage(file: File, folder = 'uploads'): Promise<string> {
  const { storage } = getFirebaseServices();
  if (!storage) throw new Error('Storage not available');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
