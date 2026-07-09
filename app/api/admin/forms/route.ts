import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/api-auth';
import { logActivityServer } from '@/lib/activity-log';
import { CustomForm } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const db = getAdminDb();
    const ref = db.collection('customForms').doc();
    const now = Date.now();

    const form: CustomForm = {
      id: ref.id,
      name: 'New Form',
      fields: [],
      placement: 'contact',
      active: false,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(form);

    await logActivityServer({
      type: 'create',
      entity: 'form',
      entityId: form.id,
      description: `Form created: ${form.name}`,
      actorId: admin.uid,
      actorName: admin.email,
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error('[api/admin/forms POST]', error);
    const message = error instanceof Error ? error.message : 'Failed to create form';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
