import type { EndpointStopCandidate, JourneyPoint } from './journey';
import type { Stop } from './types';

const EARTH_RADIUS_METERS = 6_371_000;
const ENDPOINT_RADIUS_METERS = 500;

export function distanceMeters(left: JourneyPoint, right: JourneyPoint): number {
  const toRadians = (degrees: number): number => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(right.latitude - left.latitude);
  const longitudeDelta = toRadians(right.longitude - left.longitude);
  const leftLatitude = toRadians(left.latitude);
  const rightLatitude = toRadians(right.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

export function isValidJourneyPoint(point: JourneyPoint): boolean {
  return Number.isFinite(point.latitude)
    && point.latitude >= -90
    && point.latitude <= 90
    && Number.isFinite(point.longitude)
    && point.longitude >= -180
    && point.longitude <= 180;
}

export function walkingMinutes(distance: number): number {
  if (!Number.isFinite(distance) || distance < 0) throw new RangeError('Walking distance must be a non-negative finite number.');
  return distance === 0 ? 0 : Math.max(1, Math.ceil((distance - 0.000001) / 60));
}

export function findEndpointStops(point: JourneyPoint, stops: Stop[]): EndpointStopCandidate[] {
  if (!isValidJourneyPoint(point)) return [];
  return stops.flatMap((stop) => {
    if (stop.lat === null || stop.lon === null || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lon)
      || stop.lat < -90 || stop.lat > 90 || stop.lon < -180 || stop.lon > 180) return [];
    const distance = distanceMeters(point, { latitude: stop.lat, longitude: stop.lon });
    if (distance > ENDPOINT_RADIUS_METERS + 0.000001) return [];
    return [{ stop, distanceMeters: distance, walkMinutes: walkingMinutes(distance) }];
  }).sort((left, right) => left.distanceMeters - right.distanceMeters || left.stop.name.localeCompare(right.stop.name));
}
