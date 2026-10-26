/** Geographic validation for the snapshot catalog (spec 002, FR-019/FR-021). */

export const VIGO_BOUNDS = { lat: [42.19, 42.31], lon: [-8.79, -8.67] } as const;

export function validateStopCoordinates(stop: { lat: number; lon: number }, label = 'stop'): void {
  if (!Number.isFinite(stop.lat) || !Number.isFinite(stop.lon)) {
    throw new Error(`Missing coordinates for ${label}`);
  }
  const [minLat, maxLat] = VIGO_BOUNDS.lat;
  const [minLon, maxLon] = VIGO_BOUNDS.lon;
  if (stop.lat < minLat || stop.lat > maxLat || stop.lon < minLon || stop.lon > maxLon) {
    throw new Error(`Coordinates of ${label} (${stop.lat}, ${stop.lon}) fall outside the Vigo bounding box`);
  }
}

/** Haversine distance in meters — used for ground-truth tolerance checks. */
export function distanceMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(h));
}
