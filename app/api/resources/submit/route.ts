import { NextRequest, NextResponse } from 'next/server';
import { resourceSubmissionSchema } from '@/lib/intake-schemas';
import { createResourceSubmission } from '@/lib/intake-service';
import { verifyAuth } from '@/lib/api-auth';
import { logActivityServer } from '@/lib/activity-log';
import { stripUndefined } from '@/lib/strip-undefined';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resourceSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid' }, { status: 400 });
    }
    const auth = await verifyAuth(req);
    const item = await createResourceSubmission(
      stripUndefined({
        submittedByUid: auth?.uid,
        name: parsed.data.name.trim(),
        email: parsed.data.email.trim().toLowerCase(),
        title: parsed.data.title.trim(),
        category: parsed.data.category,
        description: parsed.data.description.trim(),
        fileUrl: parsed.data.fileUrl || undefined,
      })
    );
    await logActivityServer({
      type: 'create',
      entity: 'page',
      entityId: item.id,
      description: `Resource submission: ${item.title}`,
      actorId: auth?.uid || 'public',
      actorName: item.email,
    });
    return NextResponse.json({ ok: true, id: item.id });
  } catch (error) {
    console.error('[api/resources/submit]', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
