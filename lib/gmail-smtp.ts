import nodemailer from 'nodemailer';
import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { Settings } from '@/lib/types';

async function getGmailConfig() {
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
  const settings = snap.data() as Settings | undefined;
  const gmail = settings?.integrations?.gmailSmtp;

  if (!gmail?.user || !gmail?.password) {
    throw new Error('Gmail SMTP is not configured. Add credentials in Settings → Integrations.');
  }

  return {
    host: gmail.host || 'smtp.gmail.com',
    port: gmail.port || 587,
    secure: (gmail.port || 587) === 465,
    auth: { user: gmail.user, pass: gmail.password },
    fromEmail: gmail.fromEmail || gmail.user,
    fromName: gmail.fromName || settings?.siteName || 'Abundant Global Club',
  };
}

export async function sendGmailEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const config = await getGmailConfig();

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || options.text.replace(/\n/g, '<br>'),
  });
}

export async function sendAdminInviteEmail(options: {
  to: string;
  code: string;
  role: string;
  permissions?: string[];
  expiresAt: number;
  signupUrl: string;
}): Promise<void> {
  const expiry = new Date(options.expiresAt).toLocaleDateString();
  const roleLabel = options.role.replace('_', ' ');
  const permsList =
    options.permissions && options.permissions.length > 0
      ? `\n\nAssigned access:\n${options.permissions.map((p) => `• ${p}`).join('\n')}`
      : '';

  await sendGmailEmail({
    to: options.to,
    subject: `You're invited to join Abundant Global Club as ${roleLabel}`,
    text: `You've been invited to join the Abundant Global Club admin dashboard as ${roleLabel}.

Your invite code: ${options.code}

Create your admin account at: ${options.signupUrl}

Use the email address this invite was sent to (${options.to}) along with your invite code.${permsList}

This code expires on ${expiry} and can only be used once.`,
    html: `
      <p>You've been invited to join the <strong>Abundant Global Club</strong> admin dashboard as <strong>${roleLabel}</strong>.</p>
      <p>Your invite code: <strong style="font-size:18px;letter-spacing:2px">${options.code}</strong></p>
      <p><a href="${options.signupUrl}">Click here to create your admin account</a></p>
      <p>Use the email address this invite was sent to: <strong>${options.to}</strong></p>
      ${options.permissions?.length ? `<p><strong>Assigned access:</strong></p><ul>${options.permissions.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}
      <p style="color:#666;font-size:12px">This code expires on ${expiry} and can only be used once.</p>
    `,
  });
}

export async function sendEventInviteEmail(options: {
  to: string;
  eventTitle: string;
  eventWhen: string;
  eventLocation: string;
  inviteCode: string;
  eventUrl: string;
  hostName?: string;
}): Promise<void> {
  const host = options.hostName || 'Abundant Global Club';
  await sendGmailEmail({
    to: options.to,
    subject: `You're invited: ${options.eventTitle}`,
    text: `${host} invited you to ${options.eventTitle}.

When: ${options.eventWhen}
Where: ${options.eventLocation}

Your invite code: ${options.inviteCode}

RSVP here: ${options.eventUrl}

Use this invite code when registering if the event is invite-only.`,
    html: `
      <p><strong>${host}</strong> invited you to <strong>${options.eventTitle}</strong>.</p>
      <p><strong>When:</strong> ${options.eventWhen}<br/><strong>Where:</strong> ${options.eventLocation}</p>
      <p>Your invite code: <strong style="font-size:18px;letter-spacing:2px">${options.inviteCode}</strong></p>
      <p><a href="${options.eventUrl}" style="display:inline-block;padding:10px 18px;background:#B8973A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View event & RSVP</a></p>
    `,
  });
}
