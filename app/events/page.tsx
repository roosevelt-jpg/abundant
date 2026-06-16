'use client';
export const dynamic = 'force-dynamic';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Calendar, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

export default function Events() {
  const events = [
    {
      title: 'Global Networking Summit',
      date: 'July 15-17, 2024',
      location: 'Dubai, UAE',
      type: 'In-Person',
      attendees: 500,
      image: '🌍'
    },
    {
      title: 'Virtual Masterclass: Leadership',
      date: 'July 22, 2024',
      location: 'Online',
      type: 'Online',
      attendees: 1000,
      image: '👨‍💼'
    },
    {
      title: 'Entrepreneurship Workshop',
      date: 'August 5, 2024',
      location: 'New York, USA',
      type: 'Hybrid',
      attendees: 300,
      image: '🚀'
    },
    {
      title: 'Member Appreciation Gala',
      date: 'August 20, 2024',
      location: 'Singapore',
      type: 'In-Person',
      attendees: 200,
      image: '✨'
    },
    {
      title: 'Investment Opportunity Forum',
      date: 'September 10, 2024',
      location: 'London, UK',
      type: 'In-Person',
      attendees: 400,
      image: '💼'
    },
    {
      title: 'Q3 Member Hangout',
      date: 'September 25, 2024',
      location: 'Online',
      type: 'Online',
      attendees: 2000,
      image: '🎉'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">Events</h1>
            <p className="text-lg text-muted-foreground">Join us for exclusive networking and learning opportunities</p>
          </div>
        </section>

        {/* Events Grid */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {events.map((event, i) => (
                <div key={i} className="bg-card rounded-xl border border-border hover:border-accent transition-all overflow-hidden">
                  <div className="p-6 bg-accent/10 text-center text-5xl h-24 flex items-center justify-center">
                    {event.image}
                  </div>
                  
                  <div className="p-6">
                    <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full mb-3">
                      {event.type}
                    </span>
                    
                    <h3 className="font-heading text-lg font-bold mb-4">{event.title}</h3>
                    
                    <div className="space-y-3 mb-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {event.attendees} attendees
                      </div>
                    </div>

                    <Link
                      href="/login"
                      className="block w-full py-2 px-4 text-center bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors text-sm"
                    >
                      Register Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No more events scheduled</p>
              <Link href="/contact" className="text-accent hover:text-accent/80 font-semibold">
                Suggest an event →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-accent text-accent-foreground">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl font-bold mb-6">Never Miss an Event</h2>
            <p className="mb-8 text-lg opacity-90">Sign up for exclusive invitations to all Abundant Global Club events.</p>
            <Link href="/signup" className="inline-block px-8 py-3 bg-accent-foreground text-accent rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Become a Member
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
