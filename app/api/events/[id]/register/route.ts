import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { userId, userName, userEmail } = await request.json();

    // Get Firestore database
    const db = await getDb();

    // Get event
    const eventRef = db.collection('events').doc(id);
    const eventSnap = await eventRef.get();
    
    if (!eventSnap.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventSnap.data();
    const attendees = eventData?.attendees || [];
    const registrations = (eventData?.registrations || 0) + 1;

    // Add user to attendees
    if (!attendees.includes(userId)) {
      attendees.push(userId);
    }

    // Update event with new attendee and registration count
    await eventRef.update({
      attendees,
      registrations,
      updatedAt: Date.now(),
    });

    // Create event registration record
    const registrationRef = db.collection('eventRegistrations').doc();
    await registrationRef.set({
      eventId: id,
      userId,
      userName,
      userEmail,
      registeredAt: Date.now(),
      status: 'registered',
    });

    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error('[v0] Error in POST /api/events/[id]/register:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Get Firestore database
    const db = await getDb();

    // Get event
    const eventRef = db.collection('events').doc(id);
    const eventSnap = await eventRef.get();
    
    if (!eventSnap.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventSnap.data();
    let attendees = eventData?.attendees || [];
    let registrations = (eventData?.registrations || 1) - 1;

    // Remove user from attendees
    attendees = attendees.filter((uid: string) => uid !== userId);

    // Update event
    await eventRef.update({
      attendees,
      registrations: Math.max(0, registrations),
      updatedAt: Date.now(),
    });

    // Update registration record
    const registrationsSnapshot = await db
      .collection('eventRegistrations')
      .where('eventId', '==', id)
      .where('userId', '==', userId)
      .get();

    for (const doc of registrationsSnapshot.docs) {
      await doc.ref.update({ status: 'cancelled' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in DELETE /api/events/[id]/register:', error);
    return NextResponse.json({ error: 'Failed to unregister' }, { status: 500 });
  }
}
