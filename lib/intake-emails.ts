import { sendGmailEmail } from '@/lib/gmail-smtp';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/constants';

export async function sendApplicationReceivedEmail(to: string, fullName: string): Promise<void> {
  try {
    await sendGmailEmail({
      to,
      subject: "We've received your Abundant Global Club application",
      text: `Hi ${fullName},

Thank you for applying to Abundant Global Club. We've received your application and will review it within 5–7 business days.

We'll follow up by email — no account is created until you're approved.

— Abundant Global Club
${PRIMARY_ADMIN_EMAIL}`,
    });
  } catch (err) {
    console.error('[email] application received', err);
  }
}

export async function sendMembershipInviteEmail(options: {
  to: string;
  fullName: string;
  signupUrl: string;
  expiresAt: number;
}): Promise<void> {
  const expiry = new Date(options.expiresAt).toLocaleDateString();
  await sendGmailEmail({
    to: options.to,
    subject: "You're invited to join Abundant Global Club",
    text: `Hi ${options.fullName},

Your membership application has been approved.

Create your account using this single-use invite link:
${options.signupUrl}

This link expires on ${expiry} and can only be used once.

— Abundant Global Club
${PRIMARY_ADMIN_EMAIL}`,
  });
}

export async function sendApplicationRejectedEmail(options: {
  to: string;
  fullName: string;
  body?: string;
}): Promise<void> {
  try {
    const body =
      options.body ||
      `Thank you for your interest in Abundant Global Club. After careful review, we are unable to offer membership at this time. You are welcome to apply again in the future.`;
    await sendGmailEmail({
      to: options.to,
      subject: 'Update on your Abundant Global Club application',
      text: `Hi ${options.fullName},

${body}

— Abundant Global Club
${PRIMARY_ADMIN_EMAIL}`,
    });
  } catch (err) {
    console.error('[email] application rejected', err);
  }
}
