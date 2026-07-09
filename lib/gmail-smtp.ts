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
  expiresAt: number;
  signupUrl: string;
}): Promise<void> {
  const expiry = new Date(options.expiresAt).toLocaleDateString();
  const roleLabel = options.role.replace('_', ' ');

  await sendGmailEmail({
    to: options.to,
    subject: `You're invited to join Abundant Global Club as ${roleLabel}`,
    text: `You've been invited to join the Abundant Global Club admin dashboard as ${roleLabel}.

Your invite code: ${options.code}

Sign up at: ${options.signupUrl}
Enter this code during registration.

This code expires on ${expiry} and can only be used once.`,
    html: `
      <p>You've been invited to join the <strong>Abundant Global Club</strong> admin dashboard as <strong>${roleLabel}</strong>.</p>
      <p>Your invite code: <strong style="font-size:18px;letter-spacing:2px">${options.code}</strong></p>
      <p><a href="${options.signupUrl}">Click here to sign up</a> and enter your invite code during registration.</p>
      <p style="color:#666;font-size:12px">This code expires on ${expiry} and can only be used once.</p>
    `,
  });
}
