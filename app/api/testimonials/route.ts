import { NextRequest, NextResponse } from 'next/server';
import { getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial, publishTestimonial } from '@/lib/firestore-service';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } as any),
  });
}

async function verifyAdmin(authToken: string | null | undefined) {
  if (!authToken) return false;
  try {
    const token = authToken.replace('Bearer ', '');
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken.email === 'admin@abundantglobalclub.com';
  } catch (error) {
    return false;
  }
}

// GET /api/testimonials
export async function GET() {
  try {
    const testimonials = await getTestimonials();
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error('[v0] Error in GET /api/testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

// POST /api/testimonials
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const id = await addTestimonial(data);
    return NextResponse.json({ id, ...data }, { status: 201 });
  } catch (error) {
    console.error('[v0] Error in POST /api/testimonials:', error);
    return NextResponse.json({ error: 'Failed to add testimonial' }, { status: 500 });
  }
}
