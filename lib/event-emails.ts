import { sendGmailEmail } from '@/lib/gmail-smtp';
import { brandedEmailHtml, getEmailBrandContext } from '@/lib/email-branded';
import { generateIcs, googleCalendarUrl, outlookCalendarUrl } from '@/lib/ics';
import { formatEventWhen, getEventPath } from '@/lib/event-utils';
import { getSiteUrl } from '@/lib/site-url';
import { Event } from '@/lib/types';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendEventRegistrationConfirmationEmail(options: {
  to: string;
  userName?: string;
  event: Event;
  status?: 'registered' | 'pending' | 'waitlisted';
  checkInCode?: string;
  ticketTierName?: string;
}): Promise<void> {
  const brand = await getEmailBrandContext();
  const origin = brand.origin || getSiteUrl();
  const eventUrl = `${origin.replace(/\/$/, '')}${getEventPath(options.event)}`;
  const when = formatEventWhen(options.event);
  const where = options.event.virtualLink || options.event.location || 'Location TBA';
  const name = options.userName || 'there';
  const status = options.status || 'registered';
  const googleUrl = googleCalendarUrl(options.event);
  const outlookUrl = outlookCalendarUrl(options.event);
  const ics = generateIcs(options.event);
  const filename = `${(options.event.title || 'event').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase() || 'event'}.ics`;

  const statusLine =
    status === 'waitlisted'
      ? "You're on the waitlist — we'll email you if a spot opens."
      : status === 'pending'
        ? 'Your request is pending host approval.'
        : "You're confirmed for this event.";

  const subjectPrefix =
    status === 'waitlisted' ? 'Waitlisted' : status === 'pending' ? 'RSVP received' : 'Confirmed';

  const text = `Hi ${name},

${statusLine}

Event: ${options.event.title}
When: ${when}
Where: ${where}
${options.ticketTierName ? `Ticket: ${options.ticketTierName}\n` : ''}${options.checkInCode ? `Check-in code: ${options.checkInCode}\n` : ''}
View event: ${eventUrl}

Add to your calendar:
• Google Calendar: ${googleUrl}
• Outlook: ${outlookUrl}
• Or open the attached .ics file

— ${brand.siteName}`;

  const bodyHtml = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>${escapeHtml(statusLine)}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:20px 0;border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;">
      <tr><td style="padding:16px 18px;background:#fafafa;">
        <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#001F3F;">${escapeHtml(options.event.title)}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#3f3f46;"><strong>When:</strong> ${escapeHtml(when)}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#3f3f46;"><strong>Where:</strong> ${escapeHtml(where)}</p>
        ${options.ticketTierName ? `<p style="margin:0 0 4px;font-size:14px;color:#3f3f46;"><strong>Ticket:</strong> ${escapeHtml(options.ticketTierName)}</p>` : ''}
        ${options.checkInCode ? `<p style="margin:8px 0 0;font-size:14px;color:#3f3f46;"><strong>Check-in code:</strong> <span style="font-family:ui-monospace,monospace;letter-spacing:1px;">${escapeHtml(options.checkInCode)}</span></p>` : ''}
      </td></tr>
    </table>
    <p style="margin:24px 0 12px;">
      <a href="${eventUrl}" style="display:inline-block;padding:12px 22px;background:#B8973A;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-family:system-ui,sans-serif;">
        View event
      </a>
    </p>
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#001F3F;">Add to your calendar</p>
    <p style="margin:0 0 16px;">
      <a href="${googleUrl}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 14px;border:1px solid #B8973A;color:#8A7028;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;font-family:system-ui,sans-serif;">Google Calendar</a>
      <a href="${outlookUrl}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 14px;border:1px solid #B8973A;color:#8A7028;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;font-family:system-ui,sans-serif;">Outlook</a>
    </p>
    <p style="font-size:13px;color:#71717a;">A calendar file (.ics) is also attached — open it to add this event to Apple Calendar, Outlook, or another calendar app.</p>
  `;

  await sendGmailEmail({
    to: options.to,
    subject: `${subjectPrefix}: ${options.event.title} — ${brand.siteName}`,
    text,
    html: brandedEmailHtml({
      logoUrl: brand.logoUrl,
      siteName: brand.siteName,
      title: status === 'registered' ? "You're registered" : status === 'pending' ? 'RSVP received' : "You're waitlisted",
      bodyHtml,
      footerNote: `Questions? Reply to this email or write ${brand.contactEmail}.`,
    }),
    attachments: [
      {
        filename,
        content: ics,
        contentType: 'text/calendar; charset=utf-8',
      },
    ],
  });
}
