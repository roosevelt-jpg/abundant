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

function mergeRecord<T extends Record<string, unknown>>(existing: T | undefined, incoming: T | undefined): T {
  if (!existing) return (incoming ?? {}) as T;
  if (!incoming) return existing;

  const merged = { ...existing, ...incoming };
  for (const [key, value] of Object.entries(incoming)) {
    if (SECRET_FIELD_NAMES.has(key) && isBlank(value) && !isBlank(existing[key])) {
      merged[key as keyof T] = existing[key as keyof T];
    }
  }
  return merged;
}

export function mergeSettingsIntegrations(
  existing: Settings['integrations'],
  incoming: Partial<Settings['integrations']>
): Settings['integrations'] {
  const keys = new Set([...Object.keys(existing || {}), ...Object.keys(incoming || {})]);
  const merged: Settings['integrations'] = { ...existing };

  for (const key of keys) {
    const k = key as keyof Settings['integrations'];
    merged[k] = mergeRecord(
      existing?.[k] as Record<string, unknown> | undefined,
      incoming?.[k] as Record<string, unknown> | undefined
    ) as Settings['integrations'][typeof k];
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
