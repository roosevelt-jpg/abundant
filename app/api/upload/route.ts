import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[v0] Upload API: Processing', file.name, file.size, 'bytes', 'to folder:', folder);

    // Create unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${folder}/${timestamp}-${random}.${ext}`;

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Create reference and upload
    const storageRef = ref(storage, filename);
    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('[v0] Upload API: Success', downloadURL);
    return NextResponse.json({
      success: true,
      url: downloadURL,
      filename: file.name,
    });
  } catch (error: any) {
    console.error('[v0] Upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
