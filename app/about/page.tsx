'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';
import { SideBySideSection, CoreValuesGrid, TeamGrid, HighlightCardsGrid } from '@/components/about-sections';
import { LoadState } from '@/components/load-state';

function hasCardContent(card?: { title?: string; text?: string; imageUrl?: string }) {
  return !!(card?.title?.trim() || card?.text?.trim() || card?.imageUrl?.trim());
}

export default function About() {
  const { settings, loading, error, retry } = useSettings();
  const { t } = useLanguage();
  const content = settings?.aboutContent;

  const pageTitle = content?.pageTitle?.trim() || t('about.title', 'About Abundant Global Club');
  const pageSubtitle =
    content?.pageSubtitle?.trim() ||
    t('about.subtitle', 'Cultivating excellence through global community and shared prosperity');

  const highlightCards = (content?.highlightCards || []).filter((c) => c.title?.trim() || c.text?.trim());
  const hasHighlights = highlightCards.length > 0;
  const hasFounders = hasCardContent(content?.foundersMessage);
  const hasMissionVision = hasCardContent(content?.missionVision);
  const hasCoreValues = (content?.coreValues?.length ?? 0) > 0;
  const hasTeam = (content?.teamMembers?.filter((m) => !m.suspended && m.name?.trim()).length ?? 0) > 0;
  const hasAnyContent = hasHighlights || hasFounders || hasMissionVision || hasCoreValues || hasTeam;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">{pageTitle}</h1>
            {pageSubtitle && <p className="text-lg text-muted-foreground">{pageSubtitle}</p>}
          </div>
        </section>

        <LoadState loading={loading} error={error} onRetry={retry}>
          {!hasAnyContent ? (
            <section className="py-16 px-4 text-center">
              <p className="text-muted-foreground max-w-md mx-auto">
                About page content is being prepared. Check back soon.
              </p>
            </section>
          ) : (
            <>
              {hasHighlights && (
                <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-6xl mx-auto">
                    <HighlightCardsGrid cards={highlightCards} />
                  </div>
                </section>
              )}

              {(hasFounders || hasMissionVision) && (
                <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">
                    {hasFounders && content?.foundersMessage && (
                      <SideBySideSection card={content.foundersMessage} />
                    )}
                    {hasMissionVision && content?.missionVision && (
                      <SideBySideSection card={content.missionVision} />
                    )}
                  </div>
                </section>
              )}

              {hasCoreValues && (
                <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-card/50">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="font-heading text-3xl font-bold text-center mb-10">
                      {t('about.values', 'Core Values')}
                    </h2>
                    <CoreValuesGrid values={content!.coreValues} />
                  </div>
                </section>
              )}

              {hasTeam && (
                <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-6xl mx-auto">
                    <h2 className="font-heading text-3xl font-bold text-center mb-10">
                      {t('about.team', 'Our Team')}
                    </h2>
                    <TeamGrid members={content!.teamMembers} />
                  </div>
                </section>
              )}
            </>
          )}
        </LoadState>
      </main>

      <Footer />
    </div>
  );
}
