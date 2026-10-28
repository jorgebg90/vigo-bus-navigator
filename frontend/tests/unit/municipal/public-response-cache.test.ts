import { describe, expect, it } from 'vitest';
import { PublicResponseCache } from '../../../src/infrastructure/municipal/public-response-cache';

const DAY_MS = 86_400_000;

describe('bounded public response cache', () => {
  it('expires strictly at 24 hours and retains the original receipt time', () => {
    let now = 1_800_000_000_000;
    const cache = new PublicResponseCache(() => now);
    const fetchedAt = new Date(now).toISOString();
    expect(cache.set('catalog', { lines: ['A'] }, fetchedAt)).toBe(true);

    now += DAY_MS - 1;
    expect(cache.get<{ lines: string[] }>('catalog')).toEqual({
      value: { lines: ['A'] },
      fetchedAt
    });

    now += 1;
    expect(cache.get('catalog')).toBeUndefined();
  });

  it('enforces a 100-entry LRU bound', () => {
    let now = 1_800_000_000_000;
    const cache = new PublicResponseCache(() => now);
    const fetchedAt = new Date(now).toISOString();
    for (let index = 0; index < 100; index += 1) {
      expect(cache.set(`entry-${index}`, index, fetchedAt)).toBe(true);
    }

    expect(cache.get('entry-0')?.value).toBe(0);
    expect(cache.set('entry-100', 100, fetchedAt)).toBe(true);
    expect(cache.get('entry-0')?.value).toBe(0);
    expect(cache.get('entry-1')).toBeUndefined();
    expect(cache.get('entry-100')?.value).toBe(100);
  });

  it('enforces a 4 MiB serialized size budget and rejects future or invalid timestamps', () => {
    const now = 1_800_000_000_000;
    const cache = new PublicResponseCache(() => now);
    const fetchedAt = new Date(now).toISOString();

    expect(cache.set('oversized', 'x'.repeat(4 * 1024 * 1024), fetchedAt)).toBe(false);
    expect(cache.set('future', 1, new Date(now + 1).toISOString())).toBe(false);
    expect(cache.set('invalid-date', 1, 'not-a-date')).toBe(false);
    expect(cache.get('oversized')).toBeUndefined();
  });

  it('promotes reads to most-recently-used before evicting', () => {
    let now = 1_800_000_000_000;
    const cache = new PublicResponseCache(() => now);
    const fetchedAt = new Date(now).toISOString();
    for (let index = 0; index < 100; index += 1) cache.set(`entry-${index}`, index, fetchedAt);
    cache.get('entry-0');
    cache.set('entry-100', 100, fetchedAt);

    expect(cache.get('entry-0')?.value).toBe(0);
    expect(cache.get('entry-1')).toBeUndefined();
  });
});
