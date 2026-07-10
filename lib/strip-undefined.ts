/** Remove undefined values — Firestore rejects them on write. */
export function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val === undefined) continue;
      out[key] = stripUndefined(val);
    }
    return out as T;
  }
  return value;
}

/** Alias used by settings normalize */
export const stripUndefinedDeep = stripUndefined;
