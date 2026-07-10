import { getAdminAuth } from '@/lib/firebase-admin';
import { sendGmailEmail } from '@/lib/gmail-smtp';
import {
  brandedEmailHtml,
  getEmailBrandContext,
  toAppAuthActionUrl,
} from '@/lib/email-branded';

export async function sendBrandedEmailVerification(email: string, displayName?: string): Promise<void> {
  const brand = await getEmailBrandContext();
  const auth = getAdminAuth();
  const firebaseLink = await auth.generateEmailVerificationLink(email, {
    url: `${brand.origin}/auth/action`,
    handleCodeInApp: false,
  });
  const verifyUrl = toAppAuthActionUrl(firebaseLink, brand.origin);
  const name = displayName || 'there';

  const text = `Hi ${name},

Welcome to ${brand.siteName}! Please verify your email address to activate your membership:

${verifyUrl}

If you did not create this account, you can ignore this email.

— ${brand.siteName}`;

  const bodyHtml = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Welcome to <strong>${escapeHtml(brand.siteName)}</strong>! Please verify your email address to activate your membership.</p>
    <p style="margin:24px 0;">
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 22px;background:#B8973A;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-family:system-ui,sans-serif;">
        Verify my email
      </a>
    </p>
    <p style="font-size:13px;color:#71717a;">Or copy this link:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
  `;

  await sendGmailEmail({
    to: email,
    subject: `Verify your email — ${brand.siteName}`,
    text,
    html: brandedEmailHtml({
      logoUrl: brand.logoUrl,
      siteName: brand.siteName,
      title: 'Verify your email',
      bodyHtml,
    }),
  });
}

export async function sendBrandedPasswordReset(email: string): Promise<void> {
  const brand = await getEmailBrandContext();
  const auth = getAdminAuth();
  const firebaseLink = await auth.generatePasswordResetLink(email, {
    url: `${brand.origin}/auth/action`,
    handleCodeInApp: false,
  });
  const resetUrl = toAppAuthActionUrl(firebaseLink, brand.origin);

  const text = `Hi,

We received a request to reset your ${brand.siteName} password.

Reset your password here:
${resetUrl}

If you did not request this, you can ignore this email.

— ${brand.siteName}`;

  const bodyHtml = `
    <p>We received a request to reset your password.</p>
    <p style="margin:24px 0;">
      <a href="${resetUrl}" style="display:inline-block;padding:12px 22px;background:#B8973A;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-family:system-ui,sans-serif;">
        Reset password
      </a>
    </p>
    <p style="font-size:13px;color:#71717a;">Or copy this link:<br/><a href="${resetUrl}">${resetUrl}</a></p>
  `;

  await sendGmailEmail({
    to: email,
    subject: `Reset your password — ${brand.siteName}`,
    text,
    html: brandedEmailHtml({
      logoUrl: brand.logoUrl,
      siteName: brand.siteName,
      title: 'Reset your password',
      bodyHtml,
    }),
  });
}

export async function sendFounderWelcomeEmail(options: {
  to: string;
  displayName?: string;
}): Promise<void> {
  const brand = await getEmailBrandContext();
  const name = options.displayName || 'Member';
  const membershipUrl = `${brand.origin}/membership`;

  const text = `Hi ${name},

${brand.founderWelcomeMessage}

Your membership is confirmed. Explore our packages and benefits here:
${membershipUrl}

Warm regards,
${brand.founderName}
${brand.siteName}`;

  const bodyHtml = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>${escapeHtml(brand.founderWelcomeMessage).replace(/\n/g, '<br/>')}</p>
    <p>Your membership is confirmed. Explore our packages and the benefits of each tier:</p>
    <p style="margin:24px 0;">
      <a href="${membershipUrl}" style="display:inline-block;padding:12px 22px;background:#001F3F;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-family:system-ui,sans-serif;">
        Explore membership packages
      </a>
    </p>
    <p style="margin-top:28px;">Warm regards,</p>
    <p style="margin:0;font-weight:700;color:#001F3F;">${escapeHtml(brand.founderName)}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#71717a;">${escapeHtml(brand.siteName)}</p>
  `;

  await sendGmailEmail({
    to: options.to,
    subject: `Welcome to ${brand.siteName}`,
    text,
    html: brandedEmailHtml({
      logoUrl: brand.logoUrl,
      siteName: brand.siteName,
      title: 'Welcome to the club',
      bodyHtml,
      footerNote: `Questions? Reply to this email or write ${brand.contactEmail}.`,
    }),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
