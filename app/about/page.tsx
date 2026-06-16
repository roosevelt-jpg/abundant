'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">About Abundant Global Club</h1>
            <p className="text-lg text-muted-foreground">Cultivating excellence through global community and shared prosperity</p>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-accent">M</span>
                </div>
                <h3 className="font-heading text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-muted-foreground">
                  To cultivate a global community of high-achievers committed to abundant living, mutual growth, and collective success through meaningful connections and collaborative opportunities.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-accent">V</span>
                </div>
                <h3 className="font-heading text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-muted-foreground">
                  To be the premier global network where ambitious individuals connect, collaborate, and co-create opportunities that generate abundance for themselves and their communities.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-accent">V</span>
                </div>
                <h3 className="font-heading text-2xl font-bold mb-4">Our Values</h3>
                <p className="text-muted-foreground">
                  Excellence, integrity, collaboration, abundance mindset, continuous growth, and paying it forward to create positive impact in the world.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-t border-border pt-16">
              <div>
                <h2 className="font-heading text-3xl font-bold mb-6">The Abundant Story</h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Founded on the belief that success is exponentially greater when shared, Abundant Global Club brings together like-minded individuals from around the world who are committed to growth, excellence, and positive impact.
                </p>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Our members represent diverse industries and backgrounds, united by a shared commitment to abundant living and the understanding that lifting others up elevates everyone.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Through exclusive events, collaborative opportunities, and a supportive community, Abundant Global Club empowers its members to achieve their highest potential while contributing to the success of others.
                </p>
              </div>
              <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl p-12 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-accent opacity-50 mb-4">∞</div>
                  <p className="text-muted-foreground">Infinite Possibilities</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values List */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-center mb-12">Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Excellence', desc: 'We pursue excellence in all endeavors' },
                { title: 'Integrity', desc: 'We conduct ourselves with honesty and ethics' },
                { title: 'Collaboration', desc: 'We believe in the power of working together' },
                { title: 'Growth', desc: 'We embrace continuous learning and development' },
                { title: 'Abundance', desc: 'We cultivate an abundance mindset' },
                { title: 'Impact', desc: 'We create positive change in the world' }
              ].map((value, i) => (
                <div key={i} className="p-6 bg-background rounded-xl border border-border hover:border-accent transition-colors">
                  <h3 className="font-heading font-bold text-lg text-accent mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
