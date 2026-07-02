import { getFirestore, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    // List all users to debug
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      email: doc.data().email,
      role: doc.data().role,
    }));

    return NextResponse.json({
      totalUsers: users.length,
      users,
    });
  } catch (error: any) {
    console.error('[v0] Error listing users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Query for user by email
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: `User not found: ${email}` },
        { status: 404 }
      );
    }

    const userDoc = snapshot.docs[0];
    
    // Update role
    await updateDoc(userDoc.ref, {
      role: role,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully set role to "${role}" for ${email}`,
      userId: userDoc.id,
    });
  } catch (error: any) {
    console.error('[v0] Error setting role:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set role' },
      { status: 500 }
    );
  }
}
