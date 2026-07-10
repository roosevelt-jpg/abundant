import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import {
  createMembershipInvite,
  getMembershipApplication,
  listMembershipApplications,
  updateMembershipApplication,
} from '@/lib/intake-service';
import { sendMembershipInviteEmail, sendApplicationRejectedEmail } from '@/lib/intake-emails';
import { logActivityServer } from '@/lib/activity-log';
import { notifyMembersActivity } from '@/lib/notify-activity';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const apps = await listMembershipApplications();
    return NextResponse.json(apps);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { id, action, reviewNotes, sendRejectionEmail } = body as {
      id: string;
      action: 'approve' | 'reject' | 'under_review';
      reviewNotes?: string;
      sendRejectionEmail?: boolean;
    };
    if (!id || !action) {
      return NextResponse.json({ error: 'id and action required' }, { status: 400 });
    }

    const app = await getMembershipApplication(id);
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (action === 'under_review') {
      await updateMembershipApplication(id, {
        status: 'under_review',
        reviewedBy: admin.uid,
        reviewNotes: reviewNotes || undefined,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === 'reject') {
      await updateMembershipApplication(id, {
        status: 'rejected',
        reviewedBy: admin.uid,
        reviewedAt: Date.now(),
        reviewNotes: reviewNotes || undefined,
      });
      if (sendRejectionEmail !== false) {
        await sendApplicationRejectedEmail({
          to: app.email,
          fullName: app.fullName,
          body: reviewNotes,
        });
      }
      await logActivityServer({
        type: 'update',
        entity: 'member',
        entityId: id,
        description: `Application rejected: ${app.email}`,
        actorId: admin.uid,
        actorName: admin.email,
      });
      await notifyMembersActivity({
        title: 'Application update',
        body: `An application was reviewed (${app.fullName}).`,
        link: '/admin/applications',
      });
      return NextResponse.json({ ok: true });
    }

    // approve
    await updateMembershipApplication(id, {
      status: 'approved',
      reviewedBy: admin.uid,
      reviewedAt: Date.now(),
      reviewNotes: reviewNotes || undefined,
    });

    const invite = await createMembershipInvite({
      applicationId: app.id,
      email: app.email,
    });

    const origin = req.nextUrl.origin;
    const signupUrl = `${origin}/signup?token=${invite.token}`;
    await sendMembershipInviteEmail({
      to: app.email,
      fullName: app.fullName,
      signupUrl,
      expiresAt: invite.expiresAt,
    });

    await logActivityServer({
      type: 'update',
      entity: 'member',
      entityId: id,
      description: `Application approved + invite sent: ${app.email}`,
      actorId: admin.uid,
      actorName: admin.email,
    });

    await notifyMembersActivity({
      title: 'New member invited',
      body: `${app.fullName} was approved and invited to join.`,
      link: '/admin/applications',
    });

    return NextResponse.json({ ok: true, inviteId: invite.id });
  } catch (error) {
    console.error('[api/admin/applications]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
