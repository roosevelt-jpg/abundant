'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfDay,
  isBefore,
} from 'date-fns';

interface EventCalendarProps {
  events: { id: string; date: number; title: string }[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function EventCalendar({ events, selectedDate, onSelectDate }: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const today = startOfDay(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startPad = startOfMonth(currentMonth).getDay();

  const eventsOnDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.date), day));

  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-accent/10 rounded-lg"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-heading font-bold">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-accent/10 rounded-lg"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const eventDay = eventsOnDay(day).length > 0;
          const selected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const isPast = isBefore(day, today);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`relative p-2 text-sm rounded-lg transition-colors ${
                !isSameMonth(day, currentMonth)
                  ? 'text-muted-foreground/40'
                  : selected
                    ? 'bg-accent text-accent-foreground'
                    : isToday
                      ? 'ring-2 ring-accent/50 font-semibold hover:bg-accent/10'
                      : eventDay
                        ? isPast
                          ? 'bg-muted/60 font-medium hover:bg-muted'
                          : 'bg-accent/10 font-semibold hover:bg-accent/20'
                        : isPast
                          ? 'text-muted-foreground/60 hover:bg-accent/5'
                          : 'hover:bg-accent/5'
              }`}
            >
              {format(day, 'd')}
              {eventDay && !selected && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isPast ? 'bg-muted-foreground/50' : 'bg-accent'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-accent rounded-full" />
          Upcoming
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full" />
          Past
        </span>
      </div>
    </div>
  );
}
