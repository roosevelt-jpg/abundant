import { Event } from '@/lib/types';

function formatIcsDate(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcsText(value: string): string {
  return (value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function generateIcs(event: Event): string {
  const start = formatIcsDate(event.date);
  const end = formatIcsDate(event.endDate || event.date + 2 * 60 * 60 * 1000);
  const location = event.virtualLink || event.location || '';
  const uid = `${event.id}@abundantglobalclub.com`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Abundant Global Club//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(Date.now())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description || event.subtitle || '')}`,
    `LOCATION:${escapeIcsText(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(event: Event) {
  const ics = generateIcs(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(event.title || 'event').replace(/\s+/g, '-').toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(event: Event): string {
  const start = new Date(event.date);
  const end = new Date(event.endDate || event.date + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description || event.subtitle || '',
    location: event.virtualLink || event.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Outlook.com / Office 365 compose calendar event */
export function outlookCalendarUrl(event: Event): string {
  const start = new Date(event.date).toISOString();
  const end = new Date(event.endDate || event.date + 2 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: start,
    enddt: end,
    body: event.description || event.subtitle || '',
    location: event.virtualLink || event.location || '',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}
