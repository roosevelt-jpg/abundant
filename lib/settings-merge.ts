import { Settings } from '@/lib/types';

const SECRET_FIELD_NAMES = new Set([
  'apiKey',
  'secretKey',
  'webhookSecret',
  'privateKey',
  'password',
  'serverKey',
  'publishableKey',
]);

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function hasValue(block: Record<string, unknown>, key: string): boolean {
  return !isBlank(block[key]);
}

function mergeString(existing: string | undefined, incoming: string | undefined): string {
  if (incoming === undefined) return existing ?? '';
  if (isBlank(incoming) && !isBlank(existing)) return existing!;
  return incoming;
}

/** Shallow merge that never replaces stored values with blank incoming placeholders. */
function mergeShallowPreservingBlank<T extends Record<string, unknown>>(
  existing: T | undefined,
  incoming: Partial<T> | undefined
): T | undefined {
  if (!incoming) return existing;
  if (!existing) return incoming as T;

  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (isBlank(value) && !isBlank(existing[key as keyof T])) continue;
    merged[key as keyof T] = value as T[keyof T];
  }
  return merged;
}

/** Recompute configured flag from merged integration fields (never trust client-sent configured). */
export function computeIntegrationConfigured(
  integrationKey: string,
  block: Record<string, unknown>
): boolean {
  switch (integrationKey) {
    case 'firebaseAdmin':
      return hasValue(block, 'projectId') && hasValue(block, 'clientEmail') && hasValue(block, 'privateKey');
    case 'firebaseClient':
      return hasValue(block, 'apiKey') && hasValue(block, 'projectId') && hasValue(block, 'appId');
    case 'gmailSmtp':
      return hasValue(block, 'user') && hasValue(block, 'password');
    case 'stripe':
      return hasValue(block, 'publishableKey') || hasValue(block, 'secretKey');
    case 'youtube':
      return hasValue(block, 'apiKey') || hasValue(block, 'channelId');
    case 'googlePlaces':
    case 'anthropic':
    case 'sendgrid':
      return hasValue(block, 'apiKey');
    case 'fcm':
      return hasValue(block, 'vapidKey');
    case 'whatsapp':
      return hasValue(block, 'phoneNumber');
    default:
      return block.configured === true;
  }
}

function mergeIntegrationBlock(
  existing: Record<string, unknown> | undefined,
  incoming: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!existing) return { ...(incoming ?? {}) };
  if (!incoming) return { ...existing };

  const merged: Record<string, unknown> = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (key === 'configured') continue;
    if (isBlank(value) && !isBlank(existing[key])) continue;
    merged[key] = value;
  }

  return merged;
}

export function mergeSettingsIntegrations(
  existing: Settings['integrations'],
  incoming: Partial<Settings['integrations']>
): Settings['integrations'] {
  const keys = new Set([...Object.keys(existing || {}), ...Object.keys(incoming || {})]);
  const merged: Settings['integrations'] = { ...(existing || {}) };

  for (const key of keys) {
    const k = key as keyof Settings['integrations'];
    const block = mergeIntegrationBlock(
      existing?.[k] as Record<string, unknown> | undefined,
      incoming?.[k] as Record<string, unknown> | undefined
    );
    block.configured = computeIntegrationConfigured(key, block);
    merged[k] = block as Settings['integrations'][typeof k];
  }

  return merged;
}

export function maskSettingsSecretsForDisplay(settings: Settings): Settings {
  const masked = structuredClone(settings);

  const maskBlock = (block: Record<string, unknown> | undefined) => {
    if (!block) return;
    for (const key of SECRET_FIELD_NAMES) {
      if (!isBlank(block[key])) {
        block[key] = '';
      }
    }
  };

  for (const block of Object.values(masked.integrations || {})) {
    maskBlock(block as Record<string, unknown>);
  }

  return masked;
}

export function mergeSettingsUpdates(existing: Settings, updates: Partial<Settings>): Settings {
  const result: Settings = { ...existing };

  if (updates.siteName !== undefined) result.siteName = mergeString(existing.siteName, updates.siteName);
  if (updates.description !== undefined) result.description = mergeString(existing.description, updates.description);
  if (updates.contactEmail !== undefined) result.contactEmail = mergeString(existing.contactEmail, updates.contactEmail);
  if (updates.phone !== undefined) result.phone = mergeString(existing.phone, updates.phone);
  if (updates.address !== undefined) result.address = mergeString(existing.address, updates.address);

  if (updates.languages) result.languages = updates.languages;
  if (updates.defaultLanguage) result.defaultLanguage = updates.defaultLanguage;
  if (updates.theme) result.theme = updates.theme;

  if (updates.integrations) {
    result.integrations = mergeSettingsIntegrations(existing.integrations, updates.integrations);
  }

  if (updates.socialLinks) {
    result.socialLinks = mergeShallowPreservingBlank(
      existing.socialLinks as Record<string, unknown> | undefined,
      updates.socialLinks as Record<string, unknown>
    ) as Settings['socialLinks'];
  }

  if (updates.branding) {
    result.branding = mergeShallowPreservingBlank(
      existing.branding as Record<string, unknown> | undefined,
      updates.branding as Record<string, unknown>
    ) as Settings['branding'];
  }

  if (updates.colors) {
    result.colors = mergeShallowPreservingBlank(
      existing.colors as Record<string, unknown> | undefined,
      updates.colors as Record<string, unknown>
    ) as Settings['colors'];
  }

  if (updates.youtubeSection) {
    result.youtubeSection = {
      ...existing.youtubeSection,
      ...updates.youtubeSection,
      enabled: updates.youtubeSection.enabled ?? existing.youtubeSection?.enabled ?? false,
    };
  }

  if (updates.heroSliderConfig) {
    const incomingSlides = updates.heroSliderConfig.slides;
    const keepExistingSlides = !incomingSlides || incomingSlides.length === 0;
    result.heroSliderConfig = {
      ...existing.heroSliderConfig,
      ...updates.heroSliderConfig,
      slides: keepExistingSlides
        ? existing.heroSliderConfig?.slides ?? existing.heroSlider ?? []
        : incomingSlides,
    };
    result.heroSlider = result.heroSliderConfig.slides;
  }

  if (updates.homePage) {
    result.homePage = {
      ...existing.homePage,
      ...updates.homePage,
      eventsSection: {
        ...existing.homePage?.eventsSection,
        ...updates.homePage.eventsSection,
      },
      featuresSection: {
        ...existing.homePage?.featuresSection,
        ...updates.homePage.featuresSection,
        cards:
          updates.homePage.featuresSection?.cards?.length
            ? updates.homePage.featuresSection.cards
            : existing.homePage?.featuresSection?.cards ?? [],
      },
      ctaSection: {
        ...existing.homePage?.ctaSection,
        ...updates.homePage.ctaSection,
      },
      updatedAt: updates.homePage.updatedAt ?? Date.now(),
    };
  }

  if (updates.chatbot) {
    result.chatbot = {
      ...existing.chatbot,
      ...updates.chatbot,
      knowledgeSnippets:
        updates.chatbot.knowledgeSnippets?.length
          ? updates.chatbot.knowledgeSnippets
          : existing.chatbot?.knowledgeSnippets ?? [],
      whatsappGroups:
        updates.chatbot.whatsappGroups?.length
          ? updates.chatbot.whatsappGroups
          : existing.chatbot?.whatsappGroups ?? [],
      resources:
        updates.chatbot.resources?.length ? updates.chatbot.resources : existing.chatbot?.resources ?? [],
      updatedAt: updates.chatbot.updatedAt ?? Date.now(),
    } as Settings['chatbot'];
  }

  if (updates.aboutContent) {
    result.aboutContent = {
      ...existing.aboutContent,
      ...updates.aboutContent,
      updatedAt: updates.aboutContent.updatedAt ?? Date.now(),
    };
  }

  return result;
}
