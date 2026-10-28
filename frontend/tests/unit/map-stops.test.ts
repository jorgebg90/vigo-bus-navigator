import { describe, expect, it } from 'vitest';
import { isWithinMapCoverage, isValidCurrentLocation, toMapStops } from '../../src/domain/map-stops';
import type { Stop } from '../../src/domain/types';

const stop = (overrides: Partial<Stop>): Stop => ({
  id: 'stop-1',
  code: '1001',
  vitrasaId: '1001',
  name: 'Central',
  lat: 42.2,
  lon: -8.7,
  lineIds: ['line-4a'],
  ...overrides
});

describe('toMapStops', () => {
  it('drops null pairs and coordinate pairs outside the v4 bounds', () => {
    const mapped = toMapStops([
      stop({}),
      stop({ id: 'stop-null', lat: null, lon: null }),
      stop({ id: 'stop-lat-out', lat: 42.09 }),
      stop({ id: 'stop-lon-out', lon: -8.851 }),
      stop({ id: 'stop-mixed', lat: 42.2, lon: null })
    ]);

    expect(mapped).toEqual([{
      id: 'stop-1',
      code: '1001',
      vitrasaId: '1001',
      name: 'Central',
      coordinates: [-8.7, 42.2],
      lineIds: ['line-4a']
    }]);
    expect(mapped.every(({ coordinates }) => coordinates.every(Number.isFinite))).toBe(true);
  });

  it('converts [lat, lon] to [lon, lat] once without changing source values', () => {
    const located = stop({ lat: 42.2328, lon: -8.7226 });
    const mapped = toMapStops([located]);

    expect(mapped[0].coordinates).toEqual([-8.7226, 42.2328]);
    expect(located).toMatchObject({ lat: 42.2328, lon: -8.7226 });
  });

  it('accepts the inclusive Vigo envelope and rejects invalid or out-of-coverage positions', () => {
    expect(isWithinMapCoverage({ latitude: 42.1, longitude: -8.85, accuracyMeters: 0 })).toBe(true);
    expect(isWithinMapCoverage({ latitude: 42.32, longitude: -8.6, accuracyMeters: 1 })).toBe(true);
    expect(isWithinMapCoverage({ latitude: 42.0999, longitude: -8.7, accuracyMeters: 1 })).toBe(false);
    expect(isWithinMapCoverage({ latitude: 42.2, longitude: -8.8501, accuracyMeters: 1 })).toBe(false);
    expect(isValidCurrentLocation({ latitude: Number.NaN, longitude: -8.7, accuracyMeters: 1 })).toBe(false);
    expect(isValidCurrentLocation({ latitude: 42.2, longitude: -8.7, accuracyMeters: -1 })).toBe(false);
    expect(isValidCurrentLocation({ latitude: 91, longitude: -8.7, accuracyMeters: 1 })).toBe(false);
    expect(isValidCurrentLocation({ latitude: 42.2, longitude: -181, accuracyMeters: 1 })).toBe(false);
  });

  it('drops non-finite stop coordinates before they reach the map', () => {
    expect(toMapStops([
      stop({ lat: Number.NaN }),
      stop({ lon: Number.POSITIVE_INFINITY })
    ])).toEqual([]);
  });
});
