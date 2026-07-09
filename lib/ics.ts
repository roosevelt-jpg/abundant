import { Event } from '@/lib/types';

function formatIcsDate(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateIcs(event: Event): string {
  const start = formatIcsDate(event.date);
  const end = formatIcsDate(event.endDate || event.date + 2 * 60 * 60 * 1000);
  const location = event.virtualLink || event.location;
  const uid = `${event.id}@abundantglobalclub.com`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Abundant Global Club//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(Date.now())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${event.description.replace(/,/g, '\\,').replace(/\n/g, '\\n')}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
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
  a.download = `${event.title.replace(/\s+/g, '-').toLowerCase()}.ics`;
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
    details: event.description,
    location: event.virtualLink || event.location,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
