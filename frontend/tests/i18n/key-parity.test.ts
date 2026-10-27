import { describe, expect, it } from 'vitest';
import { catalogs } from '../../src/i18n';

describe('locale parity', () => {
  const requiredKeys = [
    'navMap', 'navSearch', 'navLines', 'navSaved', 'language',
    'about',
    'noMapPosition', 'close', 'expand', 'collapse', 'stopSearch', 'clearSearch',
    'noStopsFound', 'savedFavorites', 'savedRecent',
    'removeFavorite', 'stopPanelTitle', 'linePanelTitle', 'statusLoading',
    'statusCurrent', 'statusStale', 'statusEmpty', 'statusUnavailable'
  ] as const;

  it('ships the same non-empty keys in every locale', () => {
    const keys = Object.keys(catalogs.es).sort();
    for (const catalog of Object.values(catalogs)) {
      expect(Object.keys(catalog).sort()).toEqual(keys);
      for (const key of keys) expect(catalog[key as keyof typeof catalog]).toBeTruthy();
    }
  });

  it('ships the map-first shell and view-state keys in Spanish, Galician, and English', () => {
    for (const [language, catalog] of Object.entries(catalogs)) {
      for (const key of requiredKeys) expect(catalog[key], `${language}.${key}`).toBeTruthy();
    }
  });
});
