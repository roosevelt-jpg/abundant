import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  fromEmail?: string;
  fromName?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
  const settings = snap.data();
  const apiKey = settings?.integrations?.sendgrid?.apiKey;

  if (!apiKey) {
    throw new Error('SendGrid is not configured. Add your API key in Settings → Integrations.');
  }

  const fromEmail = options.fromEmail || settings?.contactEmail || 'admin@abundantglobalclub.com';
  const fromName = options.fromName || settings?.siteName || 'Abundant Global Club';

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: fromEmail, name: fromName },
      subject: options.subject,
      content: [
        { type: 'text/plain', value: options.text },
        { type: 'text/html', value: options.html || options.text.replace(/\n/g, '<br>') },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[sendgrid]', err);
    throw new Error('Failed to send email via SendGrid');
  }
}
