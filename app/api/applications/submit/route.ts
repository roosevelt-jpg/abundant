import { NextRequest, NextResponse } from 'next/server';
import { membershipApplicationSchema } from '@/lib/intake-schemas';
import { createMembershipApplication } from '@/lib/intake-service';
import { sendApplicationReceivedEmail } from '@/lib/intake-emails';
import { logActivityServer } from '@/lib/activity-log';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/constants';
import { stripUndefined } from '@/lib/strip-undefined';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = membershipApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid application' },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const app = await createMembershipApplication(
      stripUndefined({
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        city: data.city.trim(),
        country: data.country.trim(),
        nationality: data.nationality.trim(),
        citizenship: data.citizenship.trim(),
        gender: data.gender,
        role: data.role.trim(),
        company: data.company.trim(),
        industry: data.industry,
        linkedinUrl: data.linkedinUrl || undefined,
        yearsExperience: data.yearsExperience,
        whyJoin: data.whyJoin.trim(),
        goals: data.goals,
        tierInterest: data.tierInterest,
        referredByMember: data.referredByMember,
        referrerName: data.referredByMember ? data.referrerName?.trim() : undefined,
        howHeard: data.howHeard,
        termsAcceptedAt: Date.now(),
        marketingConsent: data.marketingConsent,
      })
    );

    await sendApplicationReceivedEmail(app.email, app.fullName);
    await logActivityServer({
      type: 'create',
      entity: 'contact',
      entityId: app.id,
      description: `Membership application: ${app.fullName} (${app.email})`,
      actorId: 'public',
      actorName: app.email,
    });

    // Notify admin inbox via activity — email best-effort
    try {
      const { sendGmailEmail } = await import('@/lib/gmail-smtp');
      await sendGmailEmail({
        to: PRIMARY_ADMIN_EMAIL,
        subject: `New membership application: ${app.fullName}`,
        text: `${app.fullName} (${app.email}) applied. Tier interest: ${app.tierInterest}. Review in Admin → Applications.`,
      });
    } catch {
      /* SMTP optional */
    }

    return NextResponse.json({ ok: true, id: app.id });
  } catch (error) {
    console.error('[api/applications/submit]', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
