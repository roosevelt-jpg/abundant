import { Settings } from '@/lib/types';
import { getDefaultSettings } from '@/lib/db-service';
import { resolveHeroSliderConfig } from '@/lib/hero-slider-utils';
import { stripUndefined } from '@/lib/strip-undefined';

export { stripUndefined as stripUndefinedDeep } from '@/lib/strip-undefined';

/** Fill defaults for nested config blocks before persisting or returning to clients. */
export function normalizeSettingsForStorage(settings: Settings): Settings {
  const defaults = getDefaultSettings();
  const heroSlides = settings.heroSliderConfig?.slides ?? settings.heroSlider ?? [];

  return stripUndefined({
    ...settings,
    heroSliderConfig: resolveHeroSliderConfig(settings.heroSliderConfig, heroSlides),
    heroSlider: heroSlides,
    chatbot: {
      ...defaults.chatbot!,
      ...settings.chatbot,
      enabled: settings.chatbot?.enabled ?? defaults.chatbot!.enabled,
      knowledgeSnippets: settings.chatbot?.knowledgeSnippets ?? [],
      whatsappGroups: settings.chatbot?.whatsappGroups ?? [],
      resources: settings.chatbot?.resources ?? [],
      updatedAt: settings.chatbot?.updatedAt ?? Date.now(),
    },
  }) as Settings;
}
