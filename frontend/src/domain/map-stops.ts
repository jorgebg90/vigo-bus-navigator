import type { Stop } from './types';

export type MapStop = Omit<Stop, 'lat' | 'lon'> & { coordinates: [number, number] };

const LATITUDE_BOUNDS = [42.1, 42.32] as const;
const LONGITUDE_BOUNDS = [-8.85, -8.6] as const;

export function toMapStops(stops: Stop[]): MapStop[] {
  return stops.flatMap((stop) => {
    const { lat, lon, ...details } = stop;
    if (
      lat === null || lon === null ||
      lat < LATITUDE_BOUNDS[0] || lat > LATITUDE_BOUNDS[1] ||
      lon < LONGITUDE_BOUNDS[0] || lon > LONGITUDE_BOUNDS[1]
    ) return [];
    return [{ ...details, coordinates: [lon, lat] }];
  });
}