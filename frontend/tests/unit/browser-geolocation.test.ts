import { describe, expect, it, vi } from 'vitest';
import { BrowserGeolocation } from '../../src/infrastructure/system/browser-geolocation';

function position(latitude = 42.2, longitude = -8.7, accuracy = 12): GeolocationPosition {
  return {
    coords: {
      latitude, longitude, accuracy,
      altitude: null, altitudeAccuracy: null, heading: null, speed: null,
      toJSON: () => ({ latitude, longitude, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null })
    },
    timestamp: Date.now(),
    toJSON: () => ({
      coords: { latitude, longitude, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
      timestamp: Date.now()
    })
  };
}

describe('BrowserGeolocation', () => {
  it('returns a valid one-shot position', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => success(position()));
    const adapter = new BrowserGeolocation({ getCurrentPosition } as unknown as Geolocation);

    await expect(adapter.getCurrentPosition()).resolves.toEqual({
      kind: 'success',
      location: { latitude: 42.2, longitude: -8.7, accuracyMeters: 12 }
    });
    expect(getCurrentPosition).toHaveBeenCalledOnce();
  });

  it.each([
    [1, 'denied'],
    [2, 'error'],
    [3, 'timeout']
  ] as const)('maps browser error %s to %s', async (code, reason) => {
    const getCurrentPosition = vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
      error({ code, message: 'browser detail', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    });
    const adapter = new BrowserGeolocation({ getCurrentPosition } as unknown as Geolocation);

    await expect(adapter.getCurrentPosition()).resolves.toEqual({ kind: 'unavailable', reason });
  });

  it('reports unsupported access and rejects invalid coordinates', async () => {
    const unsupported = new BrowserGeolocation(null);
    await expect(unsupported.getCurrentPosition()).resolves.toEqual({ kind: 'unavailable', reason: 'unsupported' });

    const invalid = new BrowserGeolocation({
      getCurrentPosition: (success: PositionCallback) => success(position(Number.NaN))
    } as unknown as Geolocation);
    await expect(invalid.getCurrentPosition()).resolves.toEqual({ kind: 'unavailable', reason: 'invalid' });
  });
});
