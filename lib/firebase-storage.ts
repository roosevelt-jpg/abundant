import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadImageToStorage(file: File, folder: string = 'hero-slider'): Promise<string> {
  try {
    console.log('[v0] Starting file upload:', file.name, file.size);
    
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    // Create reference and upload
    const storageRef = ref(storage, filename);
    console.log('[v0] Uploading to:', filename);
    
    const snapshot = await uploadBytes(storageRef, file);
    console.log('[v0] Upload complete:', snapshot.metadata.fullPath);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('[v0] Got download URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('[v0] Firebase Storage upload error:', error);
    throw error instanceof Error ? error : new Error('Upload failed');
  }
}

export async function uploadVideoToStorage(file: File, folder: string = 'videos'): Promise<string> {
  try {
    console.log('[v0] Starting video upload:', file.name, file.size);
    
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'mp4';
    const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    const storageRef = ref(storage, filename);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('[v0] Firebase Storage video upload error:', error);
    throw error instanceof Error ? error : new Error('Video upload failed');
  }
}
