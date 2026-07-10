import { EventRecurrence, EventRecurrenceFrequency } from '@/lib/types';

const DAY_MS = 24 * 60 * 60 * 1000;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function getRecurrenceIntervalMs(frequency: EventRecurrenceFrequency): number | null {
  switch (frequency) {
    case 'daily':
      return DAY_MS;
    case 'weekly':
      return 7 * DAY_MS;
    case 'biweekly':
      return 14 * DAY_MS;
    case 'monthly':
      return null; // handled specially
    default:
      return null;
  }
}

/** Returns start timestamps for each occurrence including the first. */
export function generateRecurrenceStarts(
  firstStart: number,
  recurrence: EventRecurrence
): number[] {
  if (!recurrence || recurrence.frequency === 'none' || recurrence.count <= 1) {
    return [firstStart];
  }

  const count = Math.min(Math.max(2, Math.floor(recurrence.count)), 52);
  const starts: number[] = [firstStart];
  const first = new Date(firstStart);

  for (let i = 1; i < count; i++) {
    let next: number;
    if (recurrence.frequency === 'monthly') {
      next = addMonths(first, i).getTime();
    } else {
      const interval = getRecurrenceIntervalMs(recurrence.frequency);
      if (!interval) break;
      next = firstStart + interval * i;
    }
    if (recurrence.until && next > recurrence.until) break;
    starts.push(next);
  }

  return starts;
}

export function recurrenceLabel(recurrence?: EventRecurrence): string {
  if (!recurrence || recurrence.frequency === 'none') return 'Does not repeat';
  const map: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Every 2 weeks',
    monthly: 'Monthly',
  };
  return `${map[recurrence.frequency] || recurrence.frequency} · ${recurrence.count} times`;
}
