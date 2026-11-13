import type { DayType, Stop } from './types';
import { distanceMeters, walkingMinutes } from './journey-geo';

export { distanceMeters, findEndpointStops, isValidJourneyPoint, walkingMinutes } from './journey-geo';

export interface JourneyPoint {
  latitude: number;
  longitude: number;
}

export interface EndpointStopCandidate {
  stop: Stop;
  distanceMeters: number;
  walkMinutes: number;
}

export interface JourneyStopTime {
  stopId: string;
  arrivalMinute: number;
  departureMinute: number;
}

export interface JourneyTrip {
  tripId: string;
  lineCode: string;
  dayType: DayType;
  verified: boolean;
  stops: JourneyStopTime[];
}

export interface JourneyLeg {
  tripId: string;
  lineCode: string;
  boardingStopId: string;
  alightingStopId: string;
  departureMinute: number;
  arrivalMinute: number;
}

export interface JourneyOption {
  legs: JourneyLeg[];
  departureMinute: number;
  arrivalMinute: number;
  durationMinutes: number;
  transferCount: number;
  walkingMeters: number;
  walkingMinutes: number;
  originCandidate: EndpointStopCandidate;
  destinationCandidate: EndpointStopCandidate;
}

export type JourneySearchStatus = 'invalid' | 'loading' | 'complete' | 'incomplete' | 'unavailable';

export interface JourneySearchQuery {
  origin: JourneyPoint;
  destination: JourneyPoint;
  departureMinute: number;
  dayType: DayType;
}

export interface JourneyCoverage {
  complete: boolean;
  coveredLineCodes: string[];
  missingLineCodes: string[];
  noServiceLineCodes: string[];
}

export interface JourneySearchResult {
  status: JourneySearchStatus;
  options: JourneyOption[];
  coverage: JourneyCoverage;
  reason: 'invalid-query' | 'incomplete-data' | 'unavailable-data' | null;
}

export interface PlanJourneysInput {
  stops: Stop[];
  originCandidates: EndpointStopCandidate[];
  destinationCandidates: EndpointStopCandidate[];
  trips: JourneyTrip[];
  departureMinute: number;
  dayType: DayType;
}

const ENDPOINT_RADIUS_METERS = 500;
const TRANSFER_RADIUS_METERS = 300;
const MAX_TRANSFERS = 2;
const MAX_INITIAL_OPTIONS = 3;

export function planJourneys(input: PlanJourneysInput): JourneyOption[] {
  const { stops, originCandidates, destinationCandidates, trips, departureMinute, dayType } = input;
  if (!Number.isInteger(departureMinute) || departureMinute < 0
    || !originCandidates.length || !destinationCandidates.length) return [];

  const stopsById = new Map(stops.map((stop) => [stop.id, stop]));
  const destinations = new Map(destinationCandidates.map((candidate) => [candidate.stop.id, candidate]));
  const validTrips = trips.filter((trip) => trip.dayType === dayType && isValidJourneyTrip(trip, stopsById));
  const options: JourneyOption[] = [];

  const addCompletedOption = (
    legs: JourneyLeg[],
    originCandidate: EndpointStopCandidate,
    destinationCandidate: EndpointStopCandidate,
    transferDistanceMeters: number,
    transferWalkMinutes: number
  ): void => {
    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];
    const walkingTotal = originCandidate.walkMinutes + destinationCandidate.walkMinutes + transferWalkMinutes;
    options.push({
      legs,
      departureMinute: firstLeg.departureMinute,
      arrivalMinute: lastLeg.arrivalMinute,
      durationMinutes: lastLeg.arrivalMinute - departureMinute,
      transferCount: legs.length - 1,
      walkingMeters: originCandidate.distanceMeters + destinationCandidate.distanceMeters + transferDistanceMeters,
      walkingMinutes: walkingTotal,
      originCandidate,
      destinationCandidate
    });
  };

  const extend = (
    legs: JourneyLeg[],
    originCandidate: EndpointStopCandidate,
    previousStopId: string,
    previousArrivalMinute: number,
    transferDistanceMeters: number,
    transferWalkMinutes: number,
    usedTripIds: ReadonlySet<string>
  ): void => {
    for (const trip of validTrips) {
      if (usedTripIds.has(trip.tripId)) continue;
      for (let boardIndex = 0; boardIndex < trip.stops.length - 1; boardIndex += 1) {
        const boarding = trip.stops[boardIndex];
        const boardingStop = stopsById.get(boarding.stopId);
        if (!boardingStop) continue;
        if (legs.length === 0 && boarding.stopId !== originCandidate.stop.id) continue;

        let nextTransferDistance = transferDistanceMeters;
        let nextTransferWalk = transferWalkMinutes;
        let earliestDeparture = departureMinute + originCandidate.walkMinutes;
        if (legs.length > 0) {
          const previousStop = stopsById.get(previousStopId);
          if (!previousStop || previousStop.lat === null || previousStop.lon === null
            || boardingStop.lat === null || boardingStop.lon === null) continue;
          const connectorDistance = distanceMeters(
            { latitude: previousStop.lat, longitude: previousStop.lon },
            { latitude: boardingStop.lat, longitude: boardingStop.lon }
          );
          if (connectorDistance > TRANSFER_RADIUS_METERS + 0.000001) continue;
          const connectorWalkMinutes = walkingMinutes(connectorDistance);
          nextTransferDistance += connectorDistance;
          nextTransferWalk += connectorWalkMinutes;
          earliestDeparture = previousArrivalMinute + connectorWalkMinutes;
        }

        if (boarding.departureMinute < earliestDeparture) continue;

        for (let alightIndex = boardIndex + 1; alightIndex < trip.stops.length; alightIndex += 1) {
          const alighting = trip.stops[alightIndex];
          const leg: JourneyLeg = {
            tripId: trip.tripId,
            lineCode: trip.lineCode,
            boardingStopId: boarding.stopId,
            alightingStopId: alighting.stopId,
            departureMinute: boarding.departureMinute,
            arrivalMinute: alighting.arrivalMinute
          };
          const nextLegs = [...legs, leg];
          const destinationCandidate = destinations.get(alighting.stopId);
          if (destinationCandidate) {
            addCompletedOption(nextLegs, originCandidate, destinationCandidate, nextTransferDistance, nextTransferWalk);
          }
          if (nextLegs.length < MAX_TRANSFERS + 1 && !destinationCandidate) {
            const nextUsedTrips = new Set(usedTripIds);
            nextUsedTrips.add(trip.tripId);
            extend(
              nextLegs,
              originCandidate,
              alighting.stopId,
              alighting.arrivalMinute,
              nextTransferDistance,
              nextTransferWalk,
              nextUsedTrips
            );
          }
        }
      }
    }
  };

  for (const originCandidate of originCandidates) {
    extend([], originCandidate, '', departureMinute, 0, 0, new Set());
  }

  const unique = new Map<string, JourneyOption>();
  for (const option of options) {
    const key = `${option.legs.map(({ tripId, boardingStopId, alightingStopId }) => `${tripId}:${boardingStopId}:${alightingStopId}`).join('|')}`;
    if (!unique.has(key)) unique.set(key, option);
  }
  return [...unique.values()]
    .sort((left, right) => left.arrivalMinute - right.arrivalMinute
      || left.transferCount - right.transferCount
      || left.walkingMeters - right.walkingMeters)
    .slice(0, MAX_INITIAL_OPTIONS);
}

function isValidJourneyTrip(trip: JourneyTrip, stopsById: ReadonlyMap<string, Stop>): boolean {
  if (!trip.verified || !trip.tripId.trim() || !trip.lineCode.trim() || trip.stops.length < 2) return false;
  let previousDeparture = -1;
  const seenStops = new Set<string>();
  for (const scheduledStop of trip.stops) {
    const stop = stopsById.get(scheduledStop.stopId);
    if (!stop || stop.lat === null || stop.lon === null
      || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lon)
      || !Number.isInteger(scheduledStop.arrivalMinute)
      || !Number.isInteger(scheduledStop.departureMinute)
      || scheduledStop.arrivalMinute < 0
      || scheduledStop.departureMinute < scheduledStop.arrivalMinute
      || scheduledStop.arrivalMinute < previousDeparture
      || seenStops.has(scheduledStop.stopId)) return false;
    previousDeparture = scheduledStop.departureMinute;
    seenStops.add(scheduledStop.stopId);
  }
  return true;
}
