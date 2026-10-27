import { describe, expect, it } from 'vitest';
import { toMapStops } from '../../src/domain/map-stops';
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
});
