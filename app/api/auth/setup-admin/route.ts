import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Dynamically import Firestore only at runtime
    const { getFirestore, collection, setDoc, doc, query, where, getDocs } = await import('firebase/firestore');
    const { initializeApp } = await import('firebase/app');

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Check if user already exists in Firestore
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return NextResponse.json(
        { error: `User already exists: ${email}` },
        { status: 400 }
      );
    }

    // Create user profile in Firestore with admin role
    const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
    
    await setDoc(doc(db, 'users', userId), {
      email,
      role: 'admin',
      name: email.split('@')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Admin account created for ${email}. User profile set with admin role.`,
      email,
      userId,
      instructions: 'Use the password reset endpoint to set a password, or create an account via signup with this email.',
    });
  } catch (error: any) {
    console.error('[v0] Error creating admin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create admin account' },
      { status: 500 }
    );
  }
}
