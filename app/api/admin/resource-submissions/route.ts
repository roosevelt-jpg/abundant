import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import {
  listResourceSubmissions,
  updateResourceSubmission,
  getResourceSubmission,
} from '@/lib/intake-service';
import { getAdminDb } from '@/lib/firebase-admin';
import { stripUndefined } from '@/lib/strip-undefined';
import { ResourceItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    return NextResponse.json(await listResourceSubmissions());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { id, action, reviewNotes } = await req.json();
    if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

    const sub = await getResourceSubmission(id);
    if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (action === 'reject') {
      await updateResourceSubmission(id, {
        status: 'rejected',
        reviewedBy: admin.uid,
        reviewedAt: Date.now(),
        reviewNotes,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === 'approve') {
      const db = getAdminDb();
      const existing = await db.collection('resources').get();
      const ref = db.collection('resources').doc();
      const resource: ResourceItem = stripUndefined({
        id: ref.id,
        title: sub.title,
        category: sub.category,
        summary: sub.description.slice(0, 160),
        body: sub.description,
        access: 'members' as const,
        format: sub.fileUrl ? ('download' as const) : ('article' as const),
        downloadUrl: sub.fileUrl,
        order: existing.size,
        isPublished: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ref.set(resource);
      await updateResourceSubmission(id, {
        status: 'approved',
        reviewedBy: admin.uid,
        reviewedAt: Date.now(),
        reviewNotes,
      });
      return NextResponse.json({ ok: true, resourceId: ref.id });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[api/admin/resource-submissions]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
