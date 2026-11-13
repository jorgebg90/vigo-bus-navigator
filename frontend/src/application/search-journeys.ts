import { findEndpointStops, isValidJourneyPoint, type EndpointStopCandidate, type JourneyPoint } from '../domain/journey';
import { parseMadridLocalDateTime } from '../domain/journey-time';
import type { Stop } from '../domain/types';
import { eligibleTransitJourney, sortTransitJourneys, type RoutePlanningResult, type TransitJourney } from '../domain/transit-journey';
import type { RequestCancellationPort, RoutePlanningPort } from './ports';
import { isWithinMapCoverage } from '../domain/map-stops';

export interface JourneySearchInput {
  origin: JourneyPoint | null;
  destination: JourneyPoint | null;
  departureLocal: string;
}

export interface JourneySearchOutcome {
  status: 'invalid' | 'incomplete' | 'loading' | 'complete' | 'unavailable';
  options: TransitJourney[];
  originCandidates: EndpointStopCandidate[];
  destinationCandidates: EndpointStopCandidate[];
  reason: 'invalid-query' | 'incomplete-data' | 'unavailable-data' | null;
  failureReason?: Extract<RoutePlanningResult, { kind: 'unavailable' }>['reason'];
}

export async function planJourneySearch(
  planner: RoutePlanningPort,
  input: JourneySearchInput,
  stops: Stop[],
  cancellation?: RequestCancellationPort
): Promise<JourneySearchOutcome | null> {
  const initial = searchJourneys(input, stops);
  if (initial.status === 'invalid' || !input.origin || !input.destination) return initial;
  const query = { ...input, origin: input.origin, destination: input.destination };
  const result = await planner.plan(query, cancellation);
  if (cancellation?.isCancelled() || result.kind === 'cancelled') return null;
  if (result.kind === 'unavailable') {
    return { ...initial, status: 'unavailable', reason: 'unavailable-data', failureReason: result.reason };
  }
  const departure = parseMadridLocalDateTime(input.departureLocal)!;
  return {
    ...initial, status: 'complete', reason: null,
    options: sortTransitJourneys(result.journeys.filter((journey) => journey.startTime >= departure
      && eligibleTransitJourney(journey, query)))
  };
}

export function searchJourneys(input: JourneySearchInput, stops: Stop[]): JourneySearchOutcome {
  if (!input.origin || !input.destination
    || !isValidJourneyPoint(input.origin)
    || !isValidJourneyPoint(input.destination)
    || !isWithinMapCoverage({ ...input.origin, accuracyMeters: 0 })
    || !isWithinMapCoverage({ ...input.destination, accuracyMeters: 0 })
    || (input.origin.latitude === input.destination.latitude
      && input.origin.longitude === input.destination.longitude)
    || parseMadridLocalDateTime(input.departureLocal) === null) {
    return {
      status: 'invalid',
      options: [],
      originCandidates: [],
      destinationCandidates: [],
      reason: 'invalid-query'
    };
  }

  return {
    status: 'incomplete',
    options: [],
    originCandidates: findEndpointStops(input.origin, stops),
    destinationCandidates: findEndpointStops(input.destination, stops),
    reason: 'incomplete-data'
  };
}
