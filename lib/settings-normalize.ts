import { Settings } from '@/lib/types';
import { getDefaultSettings } from '@/lib/db-service';
import { resolveHeroSliderConfig } from '@/lib/hero-slider-utils';

/** Remove undefined values — Firestore rejects them on write. */
export function stripUndefinedDeep<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val === undefined) continue;
      out[key] = stripUndefinedDeep(val);
    }
    return out as T;
  }
  return value;
}

/** Fill defaults for nested config blocks before persisting or returning to clients. */
export function normalizeSettingsForStorage(settings: Settings): Settings {
  const defaults = getDefaultSettings();
  const heroSlides = settings.heroSliderConfig?.slides ?? settings.heroSlider ?? [];

  return stripUndefinedDeep({
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
