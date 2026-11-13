import type { JourneyPoint } from './journey';
import { distanceMeters } from './journey-geo';

export interface JourneyPlace extends JourneyPoint {
  name: string;
  stopId?: string;
}

export interface TransitWalkingStep {
  street: string;
  distanceMeters: number;
}

export interface TransitJourneyLeg {
  mode: 'WALK' | 'BUS';
  line: string;
  headsign: string;
  realTime: boolean;
  from: JourneyPlace;
  to: JourneyPlace;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  distanceMeters: number;
  coordinates: [number, number][];
  intermediateStops: JourneyPlace[];
  steps: TransitWalkingStep[];
}

export interface TransitJourney {
  id: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  walkingMeters: number;
  walkingSeconds: number;
  transfers: number;
  legs: TransitJourneyLeg[];
}

export interface TransitJourneyQuery {
  origin: JourneyPoint;
  destination: JourneyPoint;
  departureLocal: string;
}

export type RoutePlanningResult =
  | { kind: 'success'; journeys: TransitJourney[] }
  | { kind: 'cancelled' }
  | { kind: 'unavailable'; reason: 'invalid' | 'http' | 'network' | 'timeout' | 'oversized' | 'service' };

export function eligibleTransitJourney(journey: TransitJourney, query: TransitJourneyQuery): boolean {
  const buses = journey.legs.filter((leg) => leg.mode === 'BUS');
  if (!buses.length || buses.length > 3 || journey.transfers > 2) return false;
  if (distanceMeters(query.origin, buses[0].from) > 500.000001
    || distanceMeters(query.destination, buses[buses.length - 1].to) > 500.000001) return false;
  return buses.slice(1).every((bus, index) => distanceMeters(buses[index].to, bus.from) <= 300.000001);
}

export function sortTransitJourneys(
  journeys: TransitJourney[],
  by: 'arrival' | 'transfers' | 'walking' = 'arrival'
): TransitJourney[] {
  return [...journeys].sort((a, b) => (
    (by === 'transfers' ? a.transfers - b.transfers : by === 'walking' ? a.walkingMeters - b.walkingMeters : 0)
    || a.endTime - b.endTime || a.transfers - b.transfers || a.walkingMeters - b.walkingMeters
  ));
}
