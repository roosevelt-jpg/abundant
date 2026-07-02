'use client';
export const dynamic = 'force-dynamic';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { HeroSlider } from '@/components/hero-slider';
import { YouTubeWidget } from '@/components/youtube-widget';
import { UpcomingEventsWidget } from '@/components/upcoming-events-widget';
import Link from 'next/link';
import { ArrowRight, Users, Calendar, Zap, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WhatsAppButton />
      
      <main className="flex-1">
        {/* Hero Slider - Load independently */}
        <HeroSlider settings={null} />
        
        {/* Hero Section - Base Default */}
        <section className="relative overflow-hidden py-20 md:py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="mb-6">
                  <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
                    Welcome to Abundant
                  </span>
                </div>
                <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
                  A Global Network of Success
                </h1>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Join an exclusive community of high-achievers, entrepreneurs, and visionaries committed to abundant living and collective success.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/signup" className="btn-gradient inline-flex items-center justify-center gap-2">
                    Join Now
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/about" className="inline-flex items-center justify-center px-6 py-3 border border-border hover:bg-card transition-colors rounded-lg font-semibold">
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl p-12 aspect-square flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-accent opacity-50 mb-4">∞</div>
                    <p className="text-muted-foreground">Unlimited Possibilities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* YouTube Widget - Load independently */}
        <YouTubeWidget settings={null} />

        {/* Upcoming Events Section */}
        <UpcomingEventsWidget />

        {/* Features Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Why Join Abundant?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Experience the power of an elite global network</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Globe,
                  title: 'Global Community',
                  description: 'Connect with success-minded individuals across the world'
                },
                {
                  icon: Calendar,
                  title: 'Exclusive Events',
                  description: 'Attend curated events and networking opportunities'
                },
                {
                  icon: Users,
                  title: 'Collaboration',
                  description: 'Partner on exclusive opportunities and ventures'
                },
                {
                  icon: Zap,
                  title: 'Growth',
                  description: 'Accelerate your personal and professional growth'
                }
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="p-6 bg-background rounded-xl border border-border hover:border-accent transition-colors">
                    <Icon className="w-8 h-8 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Membership Tiers Preview */}
        {/* Removed - Membership page available at /membership */}

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#B8973A] to-[#001F3F]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Join Abundant?</h2>
            <p className="text-lg mb-8 text-gray-100">Start your journey towards abundant living and global success today.</p>
            <Link href="/signup" className="inline-flex items-center justify-center px-8 py-3 bg-white text-[#B8973A] rounded-lg font-semibold hover:bg-gray-100 transition-colors gap-2">
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
