import { describe, expect, it } from 'vitest';
import type { ArrivalReceipt, MunicipalArrival } from '../../../src/domain/types';
import { ArrivalCache } from '../../../src/infrastructure/municipal/arrival-cache';
import { deriveArrivalView } from '../../../src/domain/arrival-state';

function receipt(stopId: string, fetchedAtMs: number, arrivalCount = 0): ArrivalReceipt {
  const arrivals: MunicipalArrival[] = Array.from({ length: arrivalCount }, (_, index) => ({
    lineCode: 'A',
    destination: `${String(index).padStart(4, '0')}${'x'.repeat(100)}`,
    minutes: index
  }));
  const fetchedAt = new Date(fetchedAtMs).toISOString();
  return {
    stopId,
    vitrasaId: '90',
    fetchedAt,
    arrivals,
    provenance: { kind: 'fixture', sourceName: 'Synthetic fixture', fetchedAt }
  };
}

describe('municipal arrival receipts and bounded cache', () => {
  it('ages valid-empty receipts through exact receipt-time freshness boundaries', () => {
    const empty = receipt('app-stop-empty', 0);
    expect(deriveArrivalView(empty, new Date(29999), {
      refreshing: false,
      refreshFailed: false,
      online: true
    }).status).toBe('empty');
    expect(deriveArrivalView(empty, new Date(30000), {
      refreshing: true,
      refreshFailed: false,
      online: true
    }).status).toBe('refreshing');
    expect(deriveArrivalView(empty, new Date(299999), {
      refreshing: false,
      refreshFailed: true,
      online: true
    }).status).toBe('stale');
    const expired = deriveArrivalView(empty, new Date(300000), {
      refreshing: false,
      refreshFailed: true,
      online: true
    });
    expect(expired.status).toBe('unavailable');
    expect(expired.receipt).toBeNull();
  });

  it('expires receipts strictly at 300 seconds, rejects future timestamps, and preserves fetchedAt', () => {
    let now = 0;
    const cache = new ArrivalCache(() => now);
    const original = receipt('app-stop-1', now);
    expect(cache.set(original)).toBe(true);

    now = 299999;
    expect(cache.get(original.stopId)?.fetchedAt).toBe(original.fetchedAt);
    now = 300000;
    expect(cache.get(original.stopId)).toBeUndefined();

    const future = receipt('app-stop-future', now + 1);
    expect(cache.set(future)).toBe(false);
    expect(cache.get(future.stopId)).toBeUndefined();
    expect(deriveArrivalView(future, new Date(now), {
      refreshing: false,
      refreshFailed: false,
      online: true
    }).status).toBe('unavailable');
  });

  it('retains the 20 most-recently-used stop receipts', () => {
    const cache = new ArrivalCache(() => 0);
    for (let index = 0; index < 20; index += 1) {
      expect(cache.set(receipt(`app-stop-${index}`, 0))).toBe(true);
    }

    cache.get('app-stop-0');
    expect(cache.set(receipt('app-stop-20', 0))).toBe(true);
    expect(cache.get('app-stop-0')).toBeDefined();
    expect(cache.get('app-stop-1')).toBeUndefined();
    expect(cache.get('app-stop-20')).toBeDefined();
  });

  it('keeps serialized receipt memory at or below 512 KiB and rejects a single oversized entry', () => {
    const cache = new ArrivalCache(() => 0);
    const first = receipt('app-stop-1', 0, 1900);
    const second = receipt('app-stop-2', 0, 1900);
    expect(new TextEncoder().encode(JSON.stringify(first)).byteLength).toBeLessThan(512 * 1024);
    expect(new TextEncoder().encode(JSON.stringify(first)).byteLength
      + new TextEncoder().encode(JSON.stringify(second)).byteLength).toBeGreaterThan(512 * 1024);

    expect(cache.set(first)).toBe(true);
    expect(cache.set(second)).toBe(true);
    expect(cache.get(first.stopId)).toBeUndefined();
    expect(cache.get(second.stopId)).toBeDefined();

    const oversized = receipt('app-stop-large', 0, 4000);
    expect(cache.set(oversized)).toBe(false);
    expect(cache.get(oversized.stopId)).toBeUndefined();
  });
});
