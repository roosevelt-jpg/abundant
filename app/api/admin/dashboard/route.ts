import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/api-auth';
import { ActivityLog } from '@/lib/types';
import type { Firestore } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const db = getAdminDb();
    const now = Date.now();

    const [membersSnap, eventsSnap, testimonialsSnap, contactSnap, activitySnap] = await Promise.all([
      db.collection('users').where('role', '==', 'member').get(),
      db.collection('events').where('isPublic', '==', true).get(),
      db.collection('testimonials').get(),
      db.collection('contactSubmissions').where('status', '==', 'new').get(),
      db.collection('activityLogs').orderBy('createdAt', 'desc').limit(10).get(),
    ]);

    const upcomingEvents = eventsSnap.docs.filter((d) => (d.data().date as number) >= now).length;
    const pendingTestimonials = testimonialsSnap.docs.filter((d) => !d.data().isPublished).length;

    const stats = {
      totalMembers: membersSnap.size,
      upcomingEvents,
      pendingTestimonials,
      newContactSubmissions: contactSnap.size,
    };

    let activity: ActivityLog[] = activitySnap.docs.map((d) => d.data() as ActivityLog);

    if (activity.length === 0) {
      activity = await buildActivityFromCollections(db);
    }

    return NextResponse.json({ stats, activity });
  } catch (error) {
    console.error('[api/admin/dashboard]', error);
    const message = error instanceof Error ? error.message : 'Failed to load dashboard';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

async function buildActivityFromCollections(db: Firestore): Promise<ActivityLog[]> {
  const items: ActivityLog[] = [];

  const [members, events, contacts, testimonials] = await Promise.all([
    db.collection('users').where('role', '==', 'member').orderBy('joinedAt', 'desc').limit(3).get().catch(() => null),
    db.collection('events').orderBy('createdAt', 'desc').limit(3).get().catch(() => null),
    db.collection('contactSubmissions').orderBy('submittedAt', 'desc').limit(3).get().catch(() => null),
    db.collection('testimonials').orderBy('createdAt', 'desc').limit(3).get().catch(() => null),
  ]);

  members?.docs.forEach((d) => {
    const data = d.data();
    items.push({
      id: `member-${d.id}`,
      type: 'create',
      entity: 'member',
      entityId: d.id,
      description: `${data.displayName || data.email} joined`,
      actorId: d.id,
      actorName: data.displayName || data.email,
      createdAt: data.joinedAt || data.createdAt || Date.now(),
    });
  });

  events?.docs.forEach((d) => {
    const data = d.data();
    items.push({
      id: `event-${d.id}`,
      type: 'create',
      entity: 'event',
      entityId: d.id,
      description: `Event created: ${data.title}`,
      actorId: data.createdBy || 'system',
      actorName: 'Admin',
      createdAt: data.createdAt || Date.now(),
    });
  });

  contacts?.docs.forEach((d) => {
    const data = d.data();
    items.push({
      id: `contact-${d.id}`,
      type: 'create',
      entity: 'contact',
      entityId: d.id,
      description: `Contact submission from ${data.name}`,
      actorId: 'public',
      actorName: data.name,
      createdAt: data.submittedAt || Date.now(),
    });
  });

  testimonials?.docs.forEach((d) => {
    const data = d.data();
    items.push({
      id: `testimonial-${d.id}`,
      type: 'create',
      entity: 'testimonial',
      entityId: d.id,
      description: `Testimonial submitted by ${data.authorName}`,
      actorId: d.id,
      actorName: data.authorName,
      createdAt: data.createdAt || Date.now(),
    });
  });

  return items.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
}
