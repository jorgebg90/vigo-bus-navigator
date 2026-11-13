import { describe, expect, it } from 'vitest';
import { planJourneySearch, searchJourneys } from '../../src/application/search-journeys';
import type { Stop } from '../../src/domain/types';
import { eligibleTransitJourney, sortTransitJourneys, type TransitJourney } from '../../src/domain/transit-journey';
import type { RoutePlanningPort } from '../../src/application/ports';

const stop = (id: string, latitude: number, longitude: number): Stop => ({
  id,
  code: id,
  vitrasaId: id,
  name: id,
  lat: latitude,
  lon: longitude,
  lineIds: []
});

describe('municipal itinerary orchestration and eligibility', () => {
  const query = {
    origin: { latitude: 42.24, longitude: -8.72 },
    destination: { latitude: 42.25, longitude: -8.72 },
    departureLocal: '2026-11-13T15:53'
  };
  const startTime = Date.parse('2026-11-13T14:54:00Z');
  const journey = (): TransitJourney => ({
    id: 'one', startTime, endTime: startTime + 600_000, durationSeconds: 600,
    walkingMeters: 0, walkingSeconds: 0, transfers: 0,
    legs: [{
      mode: 'BUS', line: '4C', headsign: 'Coia', realTime: false,
      from: { ...query.origin, name: 'Boarding' }, to: { ...query.destination, name: 'Alighting' },
      startTime, endTime: startTime + 600_000, durationSeconds: 600, distanceMeters: 1000,
      coordinates: [[-8.72, 42.24], [-8.72, 42.25]], intermediateStops: [], steps: []
    }]
  });
  const north = (latitude: number, meters: number) => latitude + meters / 6_371_000 * 180 / Math.PI;

  it('uses the planner without requiring a complete local catalog', async () => {
    const planner: RoutePlanningPort = { plan: async () => ({ kind: 'success', journeys: [journey()] }) };
    const result = await planJourneySearch(planner, query, []);
    expect(result).toMatchObject({ status: 'complete', reason: null, options: [{ id: 'one' }] });
  });

  it('enforces the exact 500 m endpoint boundary, not the advisory walking distance', () => {
    const option = journey();
    option.legs[0].from.latitude = north(query.origin.latitude, 500);
    expect(eligibleTransitJourney(option, query)).toBe(true);
    option.legs[0].from.latitude = north(query.origin.latitude, 500.01);
    expect(eligibleTransitJourney(option, query)).toBe(false);
    option.legs[0].from = { ...query.origin, name: 'Origin' };
    option.legs[0].to.latitude = north(query.destination.latitude, 500.01);
    expect(eligibleTransitJourney(option, query)).toBe(false);
  });

  it('enforces two transfers and the exact 300 m connector boundary', () => {
    const option = journey();
    option.legs.push({
      ...option.legs[0],
      from: { ...query.destination, name: 'Transfer', latitude: north(query.destination.latitude, 300) }
    });
    expect(eligibleTransitJourney(option, query)).toBe(true);
    option.legs[1].from.latitude = north(query.destination.latitude, 300.01);
    expect(eligibleTransitJourney(option, query)).toBe(false);
    option.transfers = 3;
    expect(eligibleTransitJourney(option, query)).toBe(false);
  });

  it('sorts provider alternatives without mutating them', () => {
    const a = { ...journey(), id: 'earlier', transfers: 1, walkingMeters: 200 };
    const b = { ...journey(), id: 'direct', endTime: a.endTime + 1000, transfers: 0, walkingMeters: 300 };
    const c = { ...journey(), id: 'walking', endTime: a.endTime + 2000, transfers: 1, walkingMeters: 100 };
    const values = [b, a, c];
    expect(sortTransitJourneys(values).map((x) => x.id)).toEqual(['earlier', 'direct', 'walking']);
    expect(sortTransitJourneys(values, 'transfers')[0].id).toBe('direct');
    expect(sortTransitJourneys(values, 'walking')[0].id).toBe('walking');
    expect(values[0]).toBe(b);
  });

  it('rejects invalid input without calling the port and distinguishes empty, unavailable and cancelled', async () => {
    let calls = 0;
    const planner: RoutePlanningPort = { plan: async () => { calls += 1; return { kind: 'success', journeys: [] }; } };
    expect((await planJourneySearch(planner, { ...query, origin: null }, []))?.status).toBe('invalid');
    expect(calls).toBe(0);
    expect((await planJourneySearch(planner, query, []))?.status).toBe('complete');
    expect(await planJourneySearch({ plan: async () => ({ kind: 'unavailable', reason: 'service' }) }, query, []))
      .toMatchObject({ status: 'unavailable', failureReason: 'service' });
    expect(await planJourneySearch({ plan: async () => ({ kind: 'cancelled' }) }, query, [])).toBeNull();
  });
});

describe('searchJourneys', () => {
  const stops = [
    stop('origin', 42.24, -8.72),
    stop('destination', 42.25, -8.72),
    stop('outside', 42.26, -8.72)
  ];

  it('finds only stops within 500 m and remains incomplete without verified source evidence', () => {
    const result = searchJourneys({
      origin: { latitude: 42.24, longitude: -8.72 },
      destination: { latitude: 42.25, longitude: -8.72 },
      departureLocal: '2026-07-15T12:30'
    }, stops);

    expect(result.status).toBe('incomplete');
    expect(result.reason).toBe('incomplete-data');
    expect(result.options).toEqual([]);
    expect(result.originCandidates.map(({ stop: candidate }) => candidate.id)).toEqual(['origin']);
    expect(result.destinationCandidates.map(({ stop: candidate }) => candidate.id)).toEqual(['destination']);
  });

  it('rejects missing, identical, and invalid points or departure times', () => {
    expect(searchJourneys({
      origin: null,
      destination: { latitude: 42.25, longitude: -8.72 },
      departureLocal: '2026-07-15T12:30'
    }, stops).status).toBe('invalid');
    expect(searchJourneys({
      origin: { latitude: 42.24, longitude: -8.72 },
      destination: { latitude: 42.24, longitude: -8.72 },
      departureLocal: '2026-07-15T12:30'
    }, stops).status).toBe('invalid');
    expect(searchJourneys({
      origin: { latitude: 91, longitude: -8.72 },
      destination: { latitude: 42.25, longitude: -8.72 },
      departureLocal: '2026-07-15T12:30'
    }, stops).status).toBe('invalid');
    expect(searchJourneys({
      origin: { latitude: 42.24, longitude: -8.72 },
      destination: { latitude: 42.25, longitude: -8.72 },
      departureLocal: '2026-03-29T02:30'
    }, stops).status).toBe('invalid');
  });
});
