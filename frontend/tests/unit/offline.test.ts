import { describe, expect, it } from 'vitest';
import { shouldShowStaleNotice, shouldUseCachedCatalog } from '../../src/sw/offline';

describe('offline policy', () => {
  it('keeps cached catalog readable while offline and signals staleness', () => {
    expect(shouldUseCachedCatalog(false)).toBe(true);
    expect(shouldShowStaleNotice(false)).toBe(true);
    expect(shouldShowStaleNotice(true)).toBe(false);
  });
});
