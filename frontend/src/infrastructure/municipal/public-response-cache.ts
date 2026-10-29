const MAX_ENTRIES = 100;
const MAX_SERIALIZED_BYTES = 4 * 1024 * 1024;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  serialized: string;
  sizeBytes: number;
  fetchedAtMs: number;
  fetchedAt: string;
}

export class PublicResponseCache {
  private readonly entries = new Map<string, CacheEntry>();
  private totalBytes = 0;

  constructor(private readonly now: () => number = Date.now) {}

  get<T>(key: string): { value: T; fetchedAt: string } | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;

    const ageMs = this.now() - entry.fetchedAtMs;
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs >= MAX_AGE_MS) {
      this.remove(key);
      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);
    const cached = JSON.parse(entry.serialized) as { value: T; fetchedAt: string };
    return { value: cached.value, fetchedAt: entry.fetchedAt };
  }

  set<T>(key: string, value: T, fetchedAt: string): boolean {
    const fetchedAtMs = Date.parse(fetchedAt);
    const ageMs = this.now() - fetchedAtMs;
    if (!key || !Number.isFinite(fetchedAtMs) || ageMs < 0 || ageMs >= MAX_AGE_MS) {
      return false;
    }

    const serialized = JSON.stringify({ value, fetchedAt });
    if (typeof serialized !== 'string') return false;
    const sizeBytes = new TextEncoder().encode(serialized).byteLength;
    if (sizeBytes > MAX_SERIALIZED_BYTES) return false;

    this.remove(key);
    while (
      this.entries.size >= MAX_ENTRIES
      || this.totalBytes + sizeBytes > MAX_SERIALIZED_BYTES
    ) {
      const leastRecentlyUsed = this.entries.keys().next().value;
      if (leastRecentlyUsed === undefined) break;
      this.remove(leastRecentlyUsed);
    }

    this.entries.set(key, { serialized, sizeBytes, fetchedAtMs, fetchedAt });
    this.totalBytes += sizeBytes;
    return true;
  }

  private remove(key: string): void {
    const entry = this.entries.get(key);
    if (!entry) return;
    this.totalBytes -= entry.sizeBytes;
    this.entries.delete(key);
  }
}
