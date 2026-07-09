import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/api-auth';
import { logActivityServer } from '@/lib/activity-log';
import { Page } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));

    const db = getAdminDb();
    const ref = db.collection('pages').doc();
    const now = Date.now();

    const page: Page = {
      id: ref.id,
      title: body.title || 'New Page',
      slug: body.slug || `page-${ref.id.slice(0, 6)}`,
      content: body.content || '',
      isPublished: false,
      footerPlacement: body.footerPlacement || 'none',
      navPlacement: body.navPlacement || 'none',
      createdBy: admin.uid,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(page);

    await logActivityServer({
      type: 'create',
      entity: 'page',
      entityId: page.id,
      description: `Page created: ${page.title}`,
      actorId: admin.uid,
      actorName: admin.email,
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('[api/admin/pages POST]', error);
    const message = error instanceof Error ? error.message : 'Failed to create page';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
