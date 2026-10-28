import { describe, expect, it } from 'vitest';
import { firstArrivalChanged, getFreshnessState, shouldAnnounceLoading } from '../../src/domain/freshness';
import type { Arrival } from '../../src/domain/types';

const arrival = (minutes: number): Arrival => ({
  lineCode: '4A', destination: 'Bouzas', minutes
});

describe('arrival freshness and announcements', () => {
  it.each([
    [29, false, 'current'],
    [30, true, 'stale'],
    [299, true, 'stale'],
    [300, true, 'unavailable']
  ] as const)('labels data at %i seconds', (ageSeconds, upstreamFailed, expected) => {
    expect(getFreshnessState(ageSeconds, upstreamFailed, true)).toBe(expected);
  });

  it('does not label data stale unless the upstream request failed', () => {
    expect(getFreshnessState(30, false, true)).toBe('current');
    expect(getFreshnessState(299, false, true)).toBe('current');
  });

  it('is unavailable at the bound or when no result exists', () => {
    expect(getFreshnessState(300, false, true)).toBe('unavailable');
    expect(getFreshnessState(undefined, false, false)).toBe('unavailable');
  });

  it('announces a still-loading request once after three seconds', () => {
    expect(shouldAnnounceLoading(2_999, false)).toBe(false);
    expect(shouldAnnounceLoading(3_000, false)).toBe(true);
    expect(shouldAnnounceLoading(4_000, true)).toBe(false);
  });

  it('announces a refresh only when the first arrival changes', () => {
    expect(firstArrivalChanged([arrival(5)], [arrival(5)])).toBe(false);
    expect(firstArrivalChanged([arrival(5)], [arrival(4)])).toBe(true);
    expect(firstArrivalChanged([], [arrival(5)])).toBe(true);
    expect(firstArrivalChanged([arrival(5)], [])).toBe(true);
  });
});
