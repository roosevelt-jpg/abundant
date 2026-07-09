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
} from 'date-fns';

interface EventCalendarProps {
  events: { id: string; date: number; title: string }[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function EventCalendar({ events, selectedDate, onSelectDate }: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startPad = startOfMonth(currentMonth).getDay();

  const hasEvent = (day: Date) => events.some((e) => isSameDay(new Date(e.date), day));

  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-accent/10 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-heading font-bold">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-accent/10 rounded-lg">
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
          const eventDay = hasEvent(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`relative p-2 text-sm rounded-lg transition-colors ${
                !isSameMonth(day, currentMonth) ? 'text-muted-foreground/40' :
                selected ? 'bg-accent text-accent-foreground' :
                eventDay ? 'bg-accent/10 font-semibold hover:bg-accent/20' :
                'hover:bg-accent/5'
              }`}
            >
              {format(day, 'd')}
              {eventDay && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
