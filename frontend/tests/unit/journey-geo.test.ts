import { describe, expect, it } from 'vitest';
import { distanceMeters, findEndpointStops, isValidJourneyPoint, walkingMinutes } from '../../src/domain/journey-geo';
import type { Stop } from '../../src/domain/types';

const stop = (id: string, lat: number | null, lon: number | null): Stop => ({
  id,
  code: id,
  vitrasaId: id,
  name: id,
  lat,
  lon,
  lineIds: []
});

describe('journey geography', () => {
  it('validates geographic coordinates and rejects non-finite/out-of-range points', () => {
    expect(isValidJourneyPoint({ latitude: 42.24, longitude: -8.72 })).toBe(true);
    expect(isValidJourneyPoint({ latitude: Number.NaN, longitude: -8.72 })).toBe(false);
    expect(isValidJourneyPoint({ latitude: 91, longitude: -8.72 })).toBe(false);
    expect(isValidJourneyPoint({ latitude: 42.24, longitude: -181 })).toBe(false);
  });

  it('includes the 500 m endpoint boundary but excludes stops beyond it', () => {
    const longitudeAt500m = 2 * Math.asin(500 / (2 * 6_371_000)) * 180 / Math.PI;
    const candidates = findEndpointStops(
      { latitude: 0, longitude: 0 },
      [
        stop('on-boundary', 0, longitudeAt500m),
        stop('outside', 0, longitudeAt500m + 0.00001),
        stop('invalid', null, 0)
      ]
    );

    expect(candidates.map(({ stop: candidate }) => candidate.id)).toEqual(['on-boundary']);
    expect(candidates[0].distanceMeters).toBeCloseTo(500, 5);
  });

  it('calculates haversine distance and rounds non-zero walking up at 1 m/s', () => {
    expect(distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 })).toBe(0);
    expect(walkingMinutes(0)).toBe(0);
    expect(walkingMinutes(60)).toBe(1);
    expect(walkingMinutes(60.01)).toBe(2);
  });
});
