import type { CurrentLocation, Stop } from './types';

export type MapStop = Omit<Stop, 'lat' | 'lon'> & { coordinates: [number, number] };

const LATITUDE_BOUNDS = [42.1, 42.32] as const;
const LONGITUDE_BOUNDS = [-8.85, -8.6] as const;

export function isValidCurrentLocation(location: CurrentLocation): boolean {
  return Number.isFinite(location.latitude)
    && location.latitude >= -90
    && location.latitude <= 90
    && Number.isFinite(location.longitude)
    && location.longitude >= -180
    && location.longitude <= 180
    && Number.isFinite(location.accuracyMeters)
    && location.accuracyMeters >= 0;
}

export function isWithinMapCoverage(location: CurrentLocation): boolean {
  return isValidCurrentLocation(location)
    && location.latitude >= LATITUDE_BOUNDS[0]
    && location.latitude <= LATITUDE_BOUNDS[1]
    && location.longitude >= LONGITUDE_BOUNDS[0]
    && location.longitude <= LONGITUDE_BOUNDS[1];
}

export function toMapStops(stops: Stop[]): MapStop[] {
  return stops.flatMap((stop) => {
    const { lat, lon, ...details } = stop;
    if (
      lat === null || lon === null ||
      !Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < LATITUDE_BOUNDS[0] || lat > LATITUDE_BOUNDS[1] ||
      lon < LONGITUDE_BOUNDS[0] || lon > LONGITUDE_BOUNDS[1]
    ) return [];
    return [{ ...details, coordinates: [lon, lat] }];
  });
}