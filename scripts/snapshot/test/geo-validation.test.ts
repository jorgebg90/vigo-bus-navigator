import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VIGO_BOUNDS, validateStopCoordinates, distanceMeters } from '../geo';

const catalog = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../source/stops.json'), 'utf8')
) as Array<{ id: string; code: string; name: string; lat: number; lon: number }>;

describe('snapshot coordinate validation (FR-019/FR-021)', () => {
  it('accepts stops inside the Vigo bounding box', () => {
    expect(() => validateStopCoordinates({ lat: 42.2328, lon: -8.7226 })).not.toThrow();
  });

  it('rejects out-of-box coordinates with a clear error', () => {
    expect(() => validateStopCoordinates({ lat: 40.4168, lon: -3.7038 })).toThrow(/Vigo/);
    expect(() => validateStopCoordinates({ lat: 42.0, lon: -8.72 })).toThrow(/bounding box/);
  });

  it('rejects missing coordinates', () => {
    expect(() => validateStopCoordinates({ lat: Number.NaN, lon: -8.72 })).toThrow();
  });

  it('pins catalog reference stops within 50 m of ground truth (SC-008)', () => {
    // Ground truth: real-world coordinates of the fixture catalog anchors.
    const groundTruth: Record<string, { lat: number; lon: number }> = {
      'Praza de América': { lat: 42.231, lon: -8.722 },
      Bouzas: { lat: 42.223, lon: -8.743 }
    };
    for (const [name, truth] of Object.entries(groundTruth)) {
      const catalogStop = catalog.find((stop) => stop.name === name);
      expect(catalogStop, `reference stop ${name} exists in the catalog`).toBeTruthy();
      expect(
        distanceMeters({ lat: catalogStop!.lat, lon: catalogStop!.lon }, truth),
        `${name} within 50 m of ground truth`
      ).toBeLessThan(50);
    }
  });

  it('exposes the Vigo bounding box', () => {
    expect(VIGO_BOUNDS.lat).toEqual([42.19, 42.31]);
    expect(VIGO_BOUNDS.lon).toEqual([-8.79, -8.67]);
  });
});
