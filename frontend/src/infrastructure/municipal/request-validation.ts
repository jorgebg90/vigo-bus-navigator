const opaqueIdPattern = /^[^\u0000-\u001f\u007f]+$/u;
const numericIdPattern = /^[0-9]{1,12}$/;

export function isOpaqueId(value: unknown): value is string {
  return typeof value === 'string'
    && Array.from(value).length <= 128
    && value.trim().length > 0
    && opaqueIdPattern.test(value);
}

export function isNumericId(value: unknown): value is string {
  return typeof value === 'string' && numericIdPattern.test(value);
}

export function canonicalNumericId(value: unknown): string | undefined {
  if (typeof value === 'string') return isNumericId(value) ? value : undefined;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
    const canonical = String(value);
    return isNumericId(canonical) ? canonical : undefined;
  }
  return undefined;
}

export function requireOpaqueId(value: unknown, name: string): asserts value is string {
  if (!isOpaqueId(value)) throw new TypeError(`Invalid ${name}`);
}

export function requireNumericId(value: unknown, name: string): asserts value is string {
  if (!isNumericId(value)) throw new TypeError(`Invalid ${name}`);
}
