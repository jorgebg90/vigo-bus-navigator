import type { ArrivalsResponse } from './types';

/**
 * Two-entry-per-stop retention on the Cloudflare Cache API (research D4):
 *  - fresh entry: key ?stop_id=N, Cache-Control max-age=30 (freshness TTL)
 *  - last-known entry: key ?stop_id=N&lk=1, max-age=300 (staleness bound)
 * The last-known entry is served only on upstream failure, labeled stale,
 * never beyond STALE_BOUND_SECONDS, and never labeled current (SC-007).
 */

export const FRESH_TTL_SECONDS = 30;
export const STALE_BOUND_SECONDS = 300;

export interface CachePort {
  getFresh(stopId: string, now?: Date): Promise<StoredResult | undefined>;
  putFresh(stopId: string, result: StoredResult): Promise<void>;
  getLastKnown(stopId: string, now?: Date): Promise<StoredResult | undefined>;
  putLastKnown(stopId: string, result: StoredResult): Promise<void>;
}

export interface StoredResult {
  response: ArrivalsResponse;
  storedAt: string;
}

function key(stopId: string, lastKnown: boolean): Request {
  return new Request(`https://cache.local/?stop_id=${stopId}${lastKnown ? '&lk=1' : ''}`);
}

async function read(entry: Response | undefined): Promise<StoredResult | undefined> {
  if (!entry) return undefined;
  try {
    const body = await entry.json() as { response?: ArrivalsResponse; storedAt?: string };
    if (!body.response || !body.storedAt) return undefined;
    return { response: body.response, storedAt: body.storedAt };
  } catch {
    return undefined;
  }
}

async function write(cache: Cache, stopId: string, lastKnown: boolean, result: StoredResult, ttlSeconds: number): Promise<void> {
  const response = Response.json(result, {
    headers: { 'cache-control': `public, max-age=${ttlSeconds}`, 'x-edge-stored-at': result.storedAt }
  });
  await cache.put(key(stopId, lastKnown), response);
}

/** Cloudflare Cache API adapter (available under workers/miniflare runtimes). */
export class EdgeCache implements CachePort {
  constructor(private readonly store: Cache) {}

  async getFresh(stopId: string, now: Date = new Date()): Promise<StoredResult | undefined> {
    const entry = await read(await this.store.match(key(stopId, false)));
    return entry && ageSeconds(entry.storedAt, now) < FRESH_TTL_SECONDS ? entry : undefined;
  }

  async putFresh(stopId: string, result: StoredResult): Promise<void> {
    await write(this.store, stopId, false, result, FRESH_TTL_SECONDS);
  }

  async getLastKnown(stopId: string, now: Date = new Date()): Promise<StoredResult | undefined> {
    const entry = await read(await this.store.match(key(stopId, true)));
    return entry && ageSeconds(entry.storedAt, now) < STALE_BOUND_SECONDS ? entry : undefined;
  }

  async putLastKnown(stopId: string, result: StoredResult): Promise<void> {
    await write(this.store, stopId, true, result, STALE_BOUND_SECONDS);
  }
}

/** In-memory adapter for plain-node unit tests of the handler logic. */
export class MemoryCache implements CachePort {
  private readonly fresh = new Map<string, StoredResult>();
  private readonly lastKnown = new Map<string, StoredResult>();

  async getFresh(stopId: string, now: Date = new Date()): Promise<StoredResult | undefined> {
    const entry = this.fresh.get(stopId);
    return entry && ageSeconds(entry.storedAt, now) < FRESH_TTL_SECONDS ? entry : undefined;
  }

  async putFresh(stopId: string, result: StoredResult): Promise<void> {
    this.fresh.set(stopId, result);
  }

  async getLastKnown(stopId: string, now: Date = new Date()): Promise<StoredResult | undefined> {
    const entry = this.lastKnown.get(stopId);
    return entry && ageSeconds(entry.storedAt, now) < STALE_BOUND_SECONDS ? entry : undefined;
  }

  async putLastKnown(stopId: string, result: StoredResult): Promise<void> {
    this.lastKnown.set(stopId, result);
  }
}

export function ageSeconds(storedAt: string, now: Date = new Date()): number {
  return Math.max(0, (now.getTime() - Date.parse(storedAt)) / 1000);
}
