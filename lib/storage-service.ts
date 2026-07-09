import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseServices } from '@/lib/firebase';

const UPLOAD_TIMEOUT_MS = 60_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

async function uploadViaServer(file: File, folder: string, idToken: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await withTimeout(
    fetch('/api/admin/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
      body: formData,
    }),
    UPLOAD_TIMEOUT_MS,
    'Upload timed out. Check your connection and try again.'
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Upload failed');
  }
  return data.url as string;
}

async function uploadViaClient(file: File, folder: string): Promise<string> {
  const { storage } = getFirebaseServices();
  if (!storage) throw new Error('Storage not available');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
  const storageRef = ref(storage, path);

  await withTimeout(
    uploadBytes(storageRef, file, { contentType: file.type }),
    UPLOAD_TIMEOUT_MS,
    'Upload timed out. Try again or paste an image URL.'
  );

  return getDownloadURL(storageRef);
}

export async function uploadImage(
  file: File,
  folder = 'uploads',
  idToken?: string | null
): Promise<string> {
  if (idToken) {
    return uploadViaServer(file, folder, idToken);
  }
  return uploadViaClient(file, folder);
}
