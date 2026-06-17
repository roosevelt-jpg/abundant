import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Dynamically import Firebase modules at runtime
    const { initializeApp } = await import('firebase/app');
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `events/${timestamp}-${file.name}`;
    const storageRef = ref(storage, filename);

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Upload file
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    return NextResponse.json({
      success: true,
      url: downloadURL,
      filename,
    });
  } catch (error: any) {
    console.error('[v0] Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
