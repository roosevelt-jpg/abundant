'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';
import { SideBySideSection, CoreValuesGrid, TeamGrid } from '@/components/about-sections';
import { LoadState } from '@/components/load-state';

const DEFAULT_VALUES = [
  { id: '1', title: 'Excellence', description: 'We pursue excellence in all endeavors', order: 0 },
  { id: '2', title: 'Integrity', description: 'We conduct ourselves with honesty and ethics', order: 1 },
  { id: '3', title: 'Collaboration', description: 'We believe in the power of working together', order: 2 },
  { id: '4', title: 'Growth', description: 'We embrace continuous learning and development', order: 3 },
  { id: '5', title: 'Abundance', description: 'We cultivate an abundance mindset', order: 4 },
  { id: '6', title: 'Impact', description: 'We create positive change in the world', order: 5 },
];

export default function About() {
  const { settings, loading, error, retry } = useSettings();
  const { t } = useLanguage();
  const content = settings?.aboutContent;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">{t('about.title', 'About Abundant Global Club')}</h1>
            <p className="text-lg text-muted-foreground">{t('about.subtitle', 'Cultivating excellence through global community and shared prosperity')}</p>
          </div>
        </section>

        <LoadState loading={loading} error={error} onRetry={retry}>
          <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-16">
              {content?.foundersMessage && <SideBySideSection card={content.foundersMessage} />}
              {content?.missionVision && <SideBySideSection card={content.missionVision} />}

              {!content?.foundersMessage && !content?.missionVision && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { title: 'Our Mission', text: 'To cultivate a global community of high-achievers committed to abundant living, mutual growth, and collective success.' },
                    { title: 'Our Vision', text: 'To be the premier global network where ambitious individuals connect, collaborate, and co-create opportunities.' },
                    { title: 'Our Values', text: 'Excellence, integrity, collaboration, abundance mindset, continuous growth, and paying it forward.' },
                  ].map((item) => (
                    <div key={item.title} className="text-center p-6">
                      <h3 className="font-heading text-2xl font-bold mb-4">{item.title}</h3>
                      <p className="text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-heading text-3xl font-bold text-center mb-12">{t('about.values', 'Core Values')}</h2>
              <CoreValuesGrid values={content?.coreValues?.length ? content.coreValues : DEFAULT_VALUES} />
            </div>
          </section>

          {(content?.teamMembers?.length ?? 0) > 0 && (
            <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <h2 className="font-heading text-3xl font-bold text-center mb-12">{t('about.team', 'Our Team')}</h2>
                <TeamGrid members={content!.teamMembers} />
              </div>
            </section>
          )}
        </LoadState>
      </main>

      <Footer />
    </div>
  );
}
