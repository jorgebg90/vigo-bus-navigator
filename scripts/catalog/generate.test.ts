import { describe, expect, it } from 'vitest';
import { addCatalogStop, normalizeStopCoordinates, type CatalogStopRecord } from './stop-coordinates';

describe('catalog stop coordinates', () => {
  it('retains stops without coordinates as an atomic null pair', () => {
    const stops = new Map<string, CatalogStopRecord>();
    const generated = addCatalogStop(stops, { municipalCode: 'municipal-1', name: 'Searchable stop' });

    expect(generated).toMatchObject({ id: 'stop-municipal-1', name: 'Searchable stop', lat: null, lon: null });
    expect(stops.get('municipal-1')).toBe(generated);
  });

  it('fills a null coordinate pair from a later valid source but never replaces a valid pair', () => {
    const stops = new Map<string, CatalogStopRecord>();
    const generated = addCatalogStop(stops, { municipalCode: 'municipal-1', lat: null, lon: null });
    addCatalogStop(stops, { municipalCode: 'municipal-1', lat: 42.2, lon: -8.7 });
    expect(generated).toMatchObject({ lat: 42.2, lon: -8.7 });
    addCatalogStop(stops, { municipalCode: 'municipal-1', lat: 42.21, lon: -8.71 });
    expect(generated).toMatchObject({ lat: 42.2, lon: -8.7 });
  });

  it.each([
    [null, null],
    ['', ''],
    ['   ', '-8.7'],
    [Number.NaN, -8.7],
    [42.2, Number.NaN]
  ])('normalizes missing or non-finite values to null/null (%s, %s)', (lat, lon) => {
    expect(normalizeStopCoordinates(lat, lon)).toEqual({ lat: null, lon: null });
  });

  it.each([
    [42.09, -8.7],
    [42.2, -8.851],
    [42.2, -8.599]
  ])('normalizes out-of-bounds coordinate pairs to null/null (%s, %s)', (lat, lon) => {
    expect(normalizeStopCoordinates(lat, lon)).toEqual({ lat: null, lon: null });
  });

  it('preserves an in-bounds pair exactly', () => {
    expect(normalizeStopCoordinates('42.2328', '-8.7226')).toEqual({ lat: 42.2328, lon: -8.7226 });
  });
});
