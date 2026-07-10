import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID, PRIMARY_ADMIN_EMAIL } from '@/lib/constants';
import { Settings } from '@/lib/types';

export async function getEmailBrandContext() {
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
  const settings = (snap.data() as Settings | undefined) || undefined;
  const branding = settings?.branding;
  const siteName = settings?.siteName || 'Abundant Global Club';
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');

  return {
    siteName,
    logoUrl: branding?.logoUrl || `${origin.replace(/\/$/, '')}/logo-text.png`,
    founderName: branding?.founderName || 'The Founder',
    founderWelcomeMessage:
      branding?.founderWelcomeMessage ||
      'Welcome to Abundant Global Club. We are glad you are here — this community was built for ambitious people who lift each other up.',
    contactEmail: settings?.contactEmail || PRIMARY_ADMIN_EMAIL,
    origin: origin.replace(/\/$/, ''),
  };
}

/** Wrap body HTML in a branded Abundant email layout */
export function brandedEmailHtml(options: {
  logoUrl: string;
  siteName: string;
  title: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const { logoUrl, siteName, title, bodyHtml, footerNote } = options;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr>
          <td style="background:linear-gradient(90deg,#001F3F,#B8973A);padding:20px 28px;text-align:center;">
            <img src="${logoUrl}" alt="${siteName}" style="max-height:48px;max-width:220px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 8px;color:#18181b;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#001F3F;">${title}</h1>
            <div style="font-size:15px;line-height:1.6;color:#3f3f46;">${bodyHtml}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 28px;font-size:12px;color:#71717a;line-height:1.5;">
            ${footerNote || `You received this email because you have an account with ${siteName}.`}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Convert Firebase action link into our in-app /auth/action URL */
export function toAppAuthActionUrl(firebaseLink: string, origin: string): string {
  try {
    const u = new URL(firebaseLink);
    const mode = u.searchParams.get('mode') || '';
    const oobCode = u.searchParams.get('oobCode') || '';
    if (oobCode) {
      const params = new URLSearchParams({ mode, oobCode });
      return `${origin.replace(/\/$/, '')}/auth/action?${params.toString()}`;
    }
  } catch {
    /* fall through */
  }
  return firebaseLink;
}
