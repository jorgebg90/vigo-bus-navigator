import { describe, expect, it } from 'vitest';
import { catalogs } from '../../src/i18n';

describe('locale parity', () => {
  it('ships the same non-empty keys in every locale', () => {
    const keys = Object.keys(catalogs.es).sort();
    for (const catalog of Object.values(catalogs)) {
      expect(Object.keys(catalog).sort()).toEqual(keys);
      for (const key of keys) expect(catalog[key as keyof typeof catalog]).toBeTruthy();
    }
  });
});
