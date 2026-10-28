import { isReceiptTimestampConsistent } from '../../domain/municipal-contract';
import type { ArrivalReceipt } from '../../domain/types';

const MAX_STOPS = 20;
const MAX_SERIALIZED_BYTES = 512 * 1024;
const MAX_AGE_MS = 300_000;

interface CacheEntry {
  serialized: string;
  sizeBytes: number;
  fetchedAtMs: number;
}

export class ArrivalCache {
  private readonly entries = new Map<string, CacheEntry>();
  private totalBytes = 0;

  constructor(private readonly now: () => number = Date.now) {}

  get(stopId: string): ArrivalReceipt | undefined {
    const entry = this.entries.get(stopId);
    if (!entry) return undefined;

    const ageMs = this.now() - entry.fetchedAtMs;
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs >= MAX_AGE_MS) {
      this.remove(stopId);
      return undefined;
    }

    this.entries.delete(stopId);
    this.entries.set(stopId, entry);
    return JSON.parse(entry.serialized) as ArrivalReceipt;
  }

  set(receipt: ArrivalReceipt): boolean {
    if (!isReceiptTimestampConsistent(receipt)) return false;
    const fetchedAtMs = Date.parse(receipt.fetchedAt);
    const ageMs = this.now() - fetchedAtMs;
    if (!Number.isFinite(fetchedAtMs) || ageMs < 0 || ageMs >= MAX_AGE_MS) return false;

    const serialized = JSON.stringify(receipt);
    const sizeBytes = new TextEncoder().encode(serialized).byteLength;
    if (sizeBytes > MAX_SERIALIZED_BYTES) return false;

    this.remove(receipt.stopId);
    while (
      this.entries.size >= MAX_STOPS
      || this.totalBytes + sizeBytes > MAX_SERIALIZED_BYTES
    ) {
      const leastRecentlyUsed = this.entries.keys().next().value;
      if (leastRecentlyUsed === undefined) break;
      this.remove(leastRecentlyUsed);
    }

    this.entries.set(receipt.stopId, { serialized, sizeBytes, fetchedAtMs });
    this.totalBytes += sizeBytes;
    return true;
  }

  private remove(stopId: string): void {
    const entry = this.entries.get(stopId);
    if (!entry) return;
    this.totalBytes -= entry.sizeBytes;
    this.entries.delete(stopId);
  }
}
