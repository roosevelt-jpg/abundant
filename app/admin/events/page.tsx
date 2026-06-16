'use client';

import AdminEventsEditor from './editor';

export default function AdminEvents() {
  return <AdminEventsEditor />;
}

  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">Create and manage events</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors">
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      {/* Events List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-background/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Event</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Attendees</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-border hover:bg-background/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium">{event.title}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{event.date}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{event.location}</td>
                <td className="px-6 py-4 text-sm font-medium">{event.attendees}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                    event.status === 'Published'
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-yellow-500/10 text-yellow-600'
                  }`}>
                    {event.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
