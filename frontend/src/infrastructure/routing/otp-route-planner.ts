import type { RequestCancellationPort, RoutePlanningPort } from '../../application/ports';
import type { JourneyPlace, RoutePlanningResult, TransitJourney, TransitJourneyLeg, TransitJourneyQuery } from '../../domain/transit-journey';
import { isValidJourneyPoint } from '../../domain/journey-geo';
import { isWithinMapCoverage } from '../../domain/map-stops';
import { parseMadridLocalDateTime } from '../../domain/journey-time';
import { readBoundedResponse } from '../http/bounded-response';

const ENDPOINT = 'https://planificador-rutas.vigo.org/otp/routers/default/plan';
const MAX_BYTES = 2 * 1024 * 1024;
class InvalidOtpResponse extends Error {}

export class OtpRoutePlanner implements RoutePlanningPort {
  constructor(private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis)) {}

  async plan(query: TransitJourneyQuery, cancellation?: RequestCancellationPort): Promise<RoutePlanningResult> {
    if (!isValidJourneyPoint(query.origin) || !isValidJourneyPoint(query.destination)
      || !isWithinMapCoverage({ ...query.origin, accuracyMeters: 0 })
      || !isWithinMapCoverage({ ...query.destination, accuracyMeters: 0 })
      || parseMadridLocalDateTime(query.departureLocal) === null) return { kind: 'unavailable', reason: 'invalid' };
    if (cancellation?.isCancelled()) return { kind: 'cancelled' };
    const [date, time] = query.departureLocal.split('T');
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const url = new URL(ENDPOINT);
    url.search = new URLSearchParams({
      fromPlace: `${query.origin.latitude},${query.origin.longitude}`,
      toPlace: `${query.destination.latitude},${query.destination.longitude}`,
      arriveBy: 'false', date: `${month}/${day}/${year}`,
      time: `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`,
      locale: 'es', showIntermediateStops: 'true', mode: 'TRANSIT', numItineraries: '4',
      walkSpeed: '1.4', maxWalkTime: '10', wheelchair: 'false', maxWalkDistance: '500',
      maxTransfers: '2', itineraryId: 'fast', optimize: 'QUICK', walkReluctance: '10'
    }).toString();
    const controller = new AbortController();
    const unsubscribe = cancellation?.onCancelled(() => controller.abort()) ?? (() => undefined);
    if (cancellation?.isCancelled()) controller.abort();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      if (controller.signal.aborted) return { kind: 'cancelled' };
      const response = await this.fetcher(url.toString(), {
        method: 'GET', mode: 'cors', credentials: 'omit', redirect: 'error',
        referrerPolicy: 'no-referrer', signal: controller.signal, cache: 'no-store'
      });
      if (!response.ok) return { kind: 'unavailable', reason: 'http' };
      const bytes = await readBoundedResponse(response, MAX_BYTES);
      if (cancellation?.isCancelled()) return { kind: 'cancelled' };
      const payload = record(JSON.parse(new TextDecoder().decode(bytes)));
      if (payload.error != null) return { kind: 'unavailable', reason: 'service' };
      const plan = record(payload.plan);
      place(plan.from);
      place(plan.to);
      const journeys = array(plan.itineraries, 12).map(decodeJourney);
      return { kind: 'success', journeys };
    } catch (error) {
      if (cancellation?.isCancelled()) return { kind: 'cancelled' };
      if (controller.signal.aborted) return { kind: 'unavailable', reason: 'timeout' };
      if (error instanceof RangeError) return { kind: 'unavailable', reason: 'oversized' };
      if (error instanceof SyntaxError || error instanceof InvalidOtpResponse) return { kind: 'unavailable', reason: 'invalid' };
      if (error instanceof TypeError) return { kind: 'unavailable', reason: 'network' };
      throw error;
    } finally {
      clearTimeout(timeout);
      unsubscribe();
    }
  }
}

function decodeJourney(value: unknown, index: number): TransitJourney {
  const item = record(value);
  const startTime = timestamp(item.startTime);
  const endTime = timestamp(item.endTime);
  const legs = array(item.legs, 30).map(decodeLeg);
  if (!legs.length || endTime < startTime || legs[0].startTime < startTime
    || legs[legs.length - 1].endTime > endTime
    || legs.some((leg, i) => i > 0 && leg.startTime < legs[i - 1].endTime)) invalid();
  const transfers = number(item.transfers);
  if (!Number.isInteger(transfers)) invalid();
  return {
    id: `otp-${index}`, startTime, endTime, durationSeconds: number(item.duration),
    walkingMeters: legs.filter((leg) => leg.mode === 'WALK').reduce((total, leg) => total + leg.distanceMeters, 0),
    walkingSeconds: legs.filter((leg) => leg.mode === 'WALK').reduce((total, leg) => total + leg.durationSeconds, 0),
    transfers, legs
  };
}

function decodeLeg(value: unknown): TransitJourneyLeg {
  const item = record(value);
  if (item.mode !== 'WALK' && item.mode !== 'BUS') invalid();
  if (item.transitLeg !== (item.mode === 'BUS')) invalid();
  const startTime = timestamp(item.startTime);
  const endTime = timestamp(item.endTime);
  if (endTime < startTime || typeof item.realTime !== 'boolean') invalid();
  const geometry = record(item.legGeometry);
  const coordinates = decodePolyline(text(geometry.points));
  const line = item.mode === 'BUS' ? text(item.routeShortName) : '';
  return {
    mode: item.mode, line, headsign: optionalText(item.headsign),
    realTime: item.realTime, startTime, endTime,
    durationSeconds: number(item.duration), distanceMeters: number(item.distance),
    from: place(item.from), to: place(item.to), coordinates,
    intermediateStops: item.intermediateStops == null ? [] : array(item.intermediateStops, 500).map(place),
    steps: item.steps == null ? [] : array(item.steps, 1000).map((value) => {
      const step = record(value);
      return { street: text(step.streetName), distanceMeters: number(step.distance) };
    })
  };
}

function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const next = (): number => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (index >= encoded.length || shift > 30) invalid();
      byte = encoded.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) invalid();
      result += (byte & 31) * 2 ** shift;
      shift += 5;
    } while (byte >= 32);
    return result % 2 ? -(Math.floor(result / 2) + 1) : result / 2;
  };
  while (index < encoded.length) {
    latitude += next();
    longitude += next();
    const point = { latitude: latitude / 1e5, longitude: longitude / 1e5 };
    if (!validCoordinates(point.latitude, point.longitude) || coordinates.length >= 50_000) invalid();
    coordinates.push([point.longitude, point.latitude]);
  }
  if (coordinates.length < 2) invalid();
  return coordinates;
}

function place(value: unknown): JourneyPlace {
  const item = record(value);
  if (!validCoordinates(item.lat, item.lon)) invalid();
  return { name: text(item.name), latitude: item.lat as number, longitude: item.lon as number,
    ...(typeof item.stopId === 'string' ? { stopId: item.stopId } : {}) };
}

function validCoordinates(lat: unknown, lon: unknown): boolean {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90
    && typeof lon === 'number' && Number.isFinite(lon) && lon >= -180 && lon <= 180;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}
function array(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) invalid();
  return value;
}
function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) invalid();
  return value;
}
function timestamp(value: unknown): number {
  const result = number(value);
  if (!Number.isSafeInteger(result) || result > 8_640_000_000_000_000) invalid();
  return result;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 500_000) invalid();
  return value;
}
function optionalText(value: unknown): string {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > 500_000) invalid();
  return value.trim();
}
function invalid(): never { throw new InvalidOtpResponse('Invalid municipal route-planner response'); }
