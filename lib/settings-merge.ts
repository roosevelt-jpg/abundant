import { Settings, HomePageContent } from '@/lib/types';
import { resolveHeroSliderConfig } from '@/lib/hero-slider-utils';
import { getDefaultHomePage } from '@/lib/home-page';
import { getDefaultLegalPages } from '@/lib/content-page-defaults';

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

/** Fill blank stored values from defaults (for display after accidental wipes). */
function fillRecordFromDefaults<T extends Record<string, unknown>>(
  existing: T | undefined,
  defaults: T | undefined
): T | undefined {
  if (!defaults) return existing;
  const merged = { ...defaults };
  if (!existing) return merged as T;

  for (const [key, value] of Object.entries(existing)) {
    if (!isBlank(value)) merged[key as keyof T] = value as T[keyof T];
  }
  return merged as T;
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
    case 'stripeHosting':
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

/** Omit blank secret fields from PATCH payload so masked form values never reach merge. */
export function omitBlankIntegrationSecrets(
  integrations: Partial<Settings['integrations']>
): Partial<Settings['integrations']> {
  if (!integrations) return integrations;

  const result: Partial<Settings['integrations']> = {};

  for (const [integrationKey, block] of Object.entries(integrations)) {
    if (!block || typeof block !== 'object') continue;
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(block as Record<string, unknown>)) {
      if (SECRET_FIELD_NAMES.has(key) && isBlank(value)) continue;
      cleaned[key] = value;
    }
    result[integrationKey as keyof Settings['integrations']] =
      cleaned as Settings['integrations'][keyof Settings['integrations']];
  }

  return result;
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

export type IntegrationSecretHints = Record<string, Record<string, boolean>>;
export type IntegrationSecretPreviews = Record<string, Record<string, string>>;

function maskSecretPreview(value: unknown): string | undefined {
  if (isBlank(value) || typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length <= 4) return '••••';
  return `••••••••${trimmed.slice(-4)}`;
}

/** Which integration secret fields have stored values (for admin UI placeholders). */
export function getIntegrationSecretHints(settings: Settings): IntegrationSecretHints {
  const hints: IntegrationSecretHints = {};

  for (const [integrationKey, block] of Object.entries(settings.integrations || {})) {
    if (!block || typeof block !== 'object') continue;
    const record = block as Record<string, unknown>;
    const fieldHints: Record<string, boolean> = {};
    for (const key of SECRET_FIELD_NAMES) {
      if (key in record) {
        fieldHints[key] = !isBlank(record[key]);
      }
    }
    if (Object.keys(fieldHints).length > 0) {
      hints[integrationKey] = fieldHints;
    }
  }

  return hints;
}

/** Masked previews (last 4 chars) so admins can confirm a secret was saved. */
export function getIntegrationSecretPreviews(settings: Settings): IntegrationSecretPreviews {
  const previews: IntegrationSecretPreviews = {};

  for (const [integrationKey, block] of Object.entries(settings.integrations || {})) {
    if (!block || typeof block !== 'object') continue;
    const record = block as Record<string, unknown>;
    const fieldPreviews: Record<string, string> = {};
    for (const key of SECRET_FIELD_NAMES) {
      const preview = maskSecretPreview(record[key]);
      if (preview) fieldPreviews[key] = preview;
    }
    if (Object.keys(fieldPreviews).length > 0) {
      previews[integrationKey] = fieldPreviews;
    }
  }

  return previews;
}

/** Recompute configured flags from stored integration values (fixes stale Firestore flags). */
export function normalizeStoredIntegrations(integrations: Settings['integrations']): Settings['integrations'] {
  return mergeSettingsIntegrations(integrations, {});
}

export type AdminSettingsResponse = Settings & {
  _secretHints?: IntegrationSecretHints;
  _secretPreviews?: IntegrationSecretPreviews;
};

export function toAdminSettingsResponse(settings: Settings): AdminSettingsResponse {
  return {
    ...maskSettingsSecretsForDisplay(settings),
    _secretHints: getIntegrationSecretHints(settings),
    _secretPreviews: getIntegrationSecretPreviews(settings),
  };
}

/** Admin UI: treat stored secrets as present even when masked in the form. */
export function integrationBlockConfiguredWithHints(
  integrationKey: string,
  block: Record<string, unknown>,
  secretHints?: Record<string, boolean>
): boolean {
  const withHints = { ...block };
  if (secretHints) {
    for (const [key, stored] of Object.entries(secretHints)) {
      if (stored && isBlank(withHints[key])) {
        withHints[key] = '__stored__';
      }
    }
  }
  return computeIntegrationConfigured(integrationKey, withHints);
}

/** Restore blank top-level fields from defaults when reading wiped settings. */
export function fillBlankSettingsFromDefaults(settings: Settings, defaults: Settings): Settings {
  return {
    ...settings,
    siteName: isBlank(settings.siteName) ? defaults.siteName : settings.siteName,
    description: isBlank(settings.description) ? defaults.description : settings.description,
    contactEmail: isBlank(settings.contactEmail) ? defaults.contactEmail : settings.contactEmail,
    phone: isBlank(settings.phone) ? defaults.phone : settings.phone,
    address: isBlank(settings.address) ? defaults.address : settings.address,
    socialLinks: fillRecordFromDefaults(
      settings.socialLinks as Record<string, unknown> | undefined,
      defaults.socialLinks as Record<string, unknown> | undefined
    ) as Settings['socialLinks'],
    branding: fillRecordFromDefaults(
      settings.branding as Record<string, unknown> | undefined,
      defaults.branding as Record<string, unknown> | undefined
    ) as Settings['branding'],
    colors: fillRecordFromDefaults(
      settings.colors as Record<string, unknown> | undefined,
      defaults.colors as Record<string, unknown> | undefined
    ) as Settings['colors'],
    resourcesPage: settings.resourcesPage ?? defaults.resourcesPage,
    careersPage: settings.careersPage ?? defaults.careersPage,
    pressPage: settings.pressPage ?? defaults.pressPage,
    legalPages: settings.legalPages ?? defaults.legalPages,
    membershipAccess: {
      paidPlansEnabled: settings.membershipAccess?.paidPlansEnabled ?? defaults.membershipAccess?.paidPlansEnabled ?? false,
    },
    siteHosting: settings.siteHosting ?? defaults.siteHosting,
  };
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

  if (updates.membershipAccess) {
    result.membershipAccess = {
      paidPlansEnabled:
        updates.membershipAccess.paidPlansEnabled ??
        existing.membershipAccess?.paidPlansEnabled ??
        false,
    };
  }

  if (updates.siteHosting) {
    result.siteHosting = {
      ...(existing.siteHosting || { status: 'inactive', domain: 'abundantglobalclub.com', updatedAt: Date.now() }),
      ...updates.siteHosting,
      updatedAt: Date.now(),
    };
  }

  if (updates.colors) {
    result.colors = mergeShallowPreservingBlank(
      existing.colors as Record<string, unknown> | undefined,
      updates.colors as Record<string, unknown>
    ) as Settings['colors'];
  }

  if (updates.youtubeSection) {
    result.youtubeSection = {
      ...(mergeShallowPreservingBlank(
        existing.youtubeSection as Record<string, unknown> | undefined,
        updates.youtubeSection as unknown as Record<string, unknown>
      ) ?? existing.youtubeSection),
      enabled: updates.youtubeSection.enabled ?? existing.youtubeSection?.enabled ?? false,
    } as Settings['youtubeSection'];
  }

  if (updates.heroSliderConfig) {
    const incomingSlides = updates.heroSliderConfig.slides;
    const keepExistingSlides = !incomingSlides || incomingSlides.length === 0;
    const base = resolveHeroSliderConfig(
      existing.heroSliderConfig,
      keepExistingSlides ? (existing.heroSliderConfig?.slides ?? existing.heroSlider ?? []) : incomingSlides
    );

    result.heroSliderConfig = resolveHeroSliderConfig(
      {
        ...base,
        ...updates.heroSliderConfig,
        slides: keepExistingSlides ? base.slides : incomingSlides,
      },
      keepExistingSlides ? base.slides : incomingSlides
    );
    result.heroSlider = result.heroSliderConfig.slides;
  }

  if (updates.homePage) {
    const defaultHome = getDefaultHomePage();
    const baseHome = existing.homePage ?? defaultHome;
    const incomingEvents = updates.homePage.eventsSection ?? {};
    const incomingFeatures = updates.homePage.featuresSection ?? {};
    const incomingPartners = updates.homePage.partnersSection ?? {};
    const incomingCta = updates.homePage.ctaSection ?? {};

    result.homePage = {
      eventsSection: mergeShallowPreservingBlank(
        baseHome.eventsSection as Record<string, unknown>,
        incomingEvents as Record<string, unknown>
      ) as HomePageContent['eventsSection'],
      featuresSection: {
        ...(mergeShallowPreservingBlank(
          baseHome.featuresSection as Record<string, unknown>,
          incomingFeatures as Record<string, unknown>
        ) as HomePageContent['featuresSection']),
        cards:
          incomingFeatures.cards !== undefined
            ? incomingFeatures.cards
            : baseHome.featuresSection?.cards ?? defaultHome.featuresSection.cards,
      },
      partnersSection: {
        enabled: incomingPartners.enabled ?? baseHome.partnersSection?.enabled ?? defaultHome.partnersSection.enabled,
        title:
          incomingPartners.title ||
          baseHome.partnersSection?.title ||
          defaultHome.partnersSection.title,
        speed:
          incomingPartners.speed ??
          baseHome.partnersSection?.speed ??
          defaultHome.partnersSection.speed,
        direction:
          incomingPartners.direction ??
          baseHome.partnersSection?.direction ??
          defaultHome.partnersSection.direction,
        easing:
          incomingPartners.easing ??
          baseHome.partnersSection?.easing ??
          defaultHome.partnersSection.easing,
        pauseOnHover:
          incomingPartners.pauseOnHover ??
          baseHome.partnersSection?.pauseOnHover ??
          defaultHome.partnersSection.pauseOnHover,
        grayscale:
          incomingPartners.grayscale ??
          baseHome.partnersSection?.grayscale ??
          defaultHome.partnersSection.grayscale,
        showEdgeFade:
          incomingPartners.showEdgeFade ??
          baseHome.partnersSection?.showEdgeFade ??
          defaultHome.partnersSection.showEdgeFade,
        gap:
          incomingPartners.gap ??
          baseHome.partnersSection?.gap ??
          defaultHome.partnersSection.gap,
        logoHeight:
          incomingPartners.logoHeight ??
          baseHome.partnersSection?.logoHeight ??
          defaultHome.partnersSection.logoHeight,
        partners:
          incomingPartners.partners !== undefined
            ? incomingPartners.partners
            : baseHome.partnersSection?.partners ?? defaultHome.partnersSection.partners,
      },
      ctaSection: mergeShallowPreservingBlank(
        baseHome.ctaSection as Record<string, unknown>,
        incomingCta as Record<string, unknown>
      ) as HomePageContent['ctaSection'],
      updatedAt: updates.homePage.updatedAt ?? Date.now(),
    };
  }

  if (updates.chatbot) {
    const mergedScalars = mergeShallowPreservingBlank(
      existing.chatbot as Record<string, unknown> | undefined,
      updates.chatbot as unknown as Record<string, unknown>
    );

    result.chatbot = {
      ...mergedScalars,
      knowledgeSnippets:
        updates.chatbot.knowledgeSnippets !== undefined
          ? updates.chatbot.knowledgeSnippets
          : existing.chatbot?.knowledgeSnippets ?? [],
      whatsappGroups:
        updates.chatbot.whatsappGroups !== undefined
          ? updates.chatbot.whatsappGroups
          : existing.chatbot?.whatsappGroups ?? [],
      resources:
        updates.chatbot.resources !== undefined ? updates.chatbot.resources : existing.chatbot?.resources ?? [],
      updatedAt: updates.chatbot.updatedAt ?? Date.now(),
    } as Settings['chatbot'];
  }

  if (updates.aboutContent) {
    const incoming = updates.aboutContent;
    result.aboutContent = {
      ...mergeShallowPreservingBlank(
        existing.aboutContent as Record<string, unknown> | undefined,
        incoming as unknown as Record<string, unknown>
      ),
      foundersMessage: incoming.foundersMessage
        ? (mergeShallowPreservingBlank(
            existing.aboutContent?.foundersMessage as Record<string, unknown> | undefined,
            incoming.foundersMessage as unknown as Record<string, unknown>
          ) as NonNullable<Settings['aboutContent']>['foundersMessage'])
        : existing.aboutContent?.foundersMessage,
      missionVision: incoming.missionVision
        ? (mergeShallowPreservingBlank(
            existing.aboutContent?.missionVision as Record<string, unknown> | undefined,
            incoming.missionVision as unknown as Record<string, unknown>
          ) as NonNullable<Settings['aboutContent']>['missionVision'])
        : existing.aboutContent?.missionVision,
      teamMembers: incoming.teamMembers !== undefined ? incoming.teamMembers : existing.aboutContent?.teamMembers ?? [],
      highlightCards:
        incoming.highlightCards !== undefined
          ? incoming.highlightCards
          : existing.aboutContent?.highlightCards ?? [],
      updatedAt: incoming.updatedAt ?? Date.now(),
    };
  }

  if (updates.resourcesPage) {
    result.resourcesPage = {
      ...existing.resourcesPage,
      ...updates.resourcesPage,
      hero: { ...existing.resourcesPage?.hero, ...updates.resourcesPage.hero },
      submitCta: { ...existing.resourcesPage?.submitCta, ...updates.resourcesPage.submitCta },
      categories:
        updates.resourcesPage.categories !== undefined
          ? updates.resourcesPage.categories
          : existing.resourcesPage?.categories ?? [],
      updatedAt: updates.resourcesPage.updatedAt ?? Date.now(),
    };
  }

  if (updates.careersPage) {
    result.careersPage = {
      ...existing.careersPage,
      ...updates.careersPage,
      hero: { ...existing.careersPage?.hero, ...updates.careersPage.hero },
      updatedAt: updates.careersPage.updatedAt ?? Date.now(),
    };
  }

  if (updates.pressPage) {
    result.pressPage = {
      ...existing.pressPage,
      ...updates.pressPage,
      hero: { ...existing.pressPage?.hero, ...updates.pressPage.hero },
      mediaKitDownloads:
        updates.pressPage.mediaKitDownloads !== undefined
          ? updates.pressPage.mediaKitDownloads
          : existing.pressPage?.mediaKitDownloads ?? [],
      updatedAt: updates.pressPage.updatedAt ?? Date.now(),
    };
  }

  if (updates.legalPages) {
    const defaults = getDefaultLegalPages();
    result.legalPages = {
      privacy: updates.legalPages.privacy
        ? {
            ...defaults.privacy,
            ...existing.legalPages?.privacy,
            ...updates.legalPages.privacy,
            sections: updates.legalPages.privacy.sections?.length
              ? updates.legalPages.privacy.sections
              : existing.legalPages?.privacy?.sections ?? defaults.privacy.sections,
          }
        : existing.legalPages?.privacy ?? defaults.privacy,
      terms: updates.legalPages.terms
        ? {
            ...defaults.terms,
            ...existing.legalPages?.terms,
            ...updates.legalPages.terms,
            sections: updates.legalPages.terms.sections?.length
              ? updates.legalPages.terms.sections
              : existing.legalPages?.terms?.sections ?? defaults.terms.sections,
          }
        : existing.legalPages?.terms ?? defaults.terms,
      updatedAt: updates.legalPages.updatedAt ?? Date.now(),
    };
  }

  return result;
}
