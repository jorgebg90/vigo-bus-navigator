import type { GeolocationPort, GeolocationResult } from '../../application/ports';

export class BrowserGeolocation implements GeolocationPort {
  constructor(private readonly geolocation: Geolocation | null = globalThis.navigator?.geolocation ?? null) {}

  getCurrentPosition(): Promise<GeolocationResult> {
    const geolocation = this.geolocation;
    if (!geolocation) return Promise.resolve({ kind: 'unavailable', reason: 'unsupported' });

    return new Promise((resolve) => {
      geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (
            !Number.isFinite(latitude) || latitude < -90 || latitude > 90
            || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
            || !Number.isFinite(accuracy) || accuracy < 0
          ) {
            resolve({ kind: 'unavailable', reason: 'invalid' });
            return;
          }
          resolve({ kind: 'success', location: { latitude, longitude, accuracyMeters: accuracy } });
        },
        (error) => {
          const reason = error.code === error.PERMISSION_DENIED
            ? 'denied'
            : error.code === error.TIMEOUT
              ? 'timeout'
              : 'error';
          resolve({ kind: 'unavailable', reason });
        },
        { maximumAge: 0, timeout: 10_000 }
      );
    });
  }
}
