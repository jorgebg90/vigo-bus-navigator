import { describe, expect, it } from 'vitest';
import { findEndpointStops, planJourneys } from '../../src/domain/journey';
import type { JourneyTrip } from '../../src/domain/journey';
import type { Stop } from '../../src/domain/types';

const stop = (id: string, latitude: number, longitude: number): Stop => ({
  id,
  code: id,
  vitrasaId: id,
  name: id,
  lat: latitude,
  lon: longitude,
  lineIds: []
});

const trip = (tripId: string, lineCode: string, stops: JourneyTrip['stops']): JourneyTrip => ({
  tripId,
  lineCode,
  dayType: 'weekday',
  verified: true,
  stops
});

describe('planJourneys', () => {
  const origin = stop('origin', 0, 0);
  const transferA = stop('transfer-a', 0, 0.01);
  const transferB = stop('transfer-b', 0, 0.011);
  const destination = stop('destination', 0, 0.03);
  const catalog = [origin, transferA, transferB, destination];
  const originCandidates = findEndpointStops({ latitude: 0, longitude: 0 }, catalog);
  const destinationCandidates = findEndpointStops({ latitude: 0, longitude: 0.03 }, catalog);

  it('returns a direct verified journey and ranks it before a later arrival', () => {
    const options = planJourneys({
      stops: catalog,
      originCandidates,
      destinationCandidates,
      trips: [
        trip('later', 'L2', [
          { stopId: 'origin', arrivalMinute: 611, departureMinute: 611 },
          { stopId: 'destination', arrivalMinute: 650, departureMinute: 650 }
        ]),
        trip('earlier', 'L1', [
          { stopId: 'origin', arrivalMinute: 600, departureMinute: 600 },
          { stopId: 'destination', arrivalMinute: 630, departureMinute: 630 }
        ])
      ],
      departureMinute: 590,
      dayType: 'weekday'
    });

    expect(options[0].legs.map(({ tripId }) => tripId)).toEqual(['earlier']);
    expect(options[0].arrivalMinute).toBe(630);
  });

  it('allows feasible transfers within 300 m, accounting for the walking connector', () => {
    const options = planJourneys({
      stops: catalog,
      originCandidates,
      destinationCandidates,
      trips: [
        trip('first', 'L1', [
          { stopId: 'origin', arrivalMinute: 600, departureMinute: 600 },
          { stopId: 'transfer-a', arrivalMinute: 620, departureMinute: 620 }
        ]),
        trip('second', 'L2', [
          { stopId: 'transfer-b', arrivalMinute: 625, departureMinute: 625 },
          { stopId: 'destination', arrivalMinute: 640, departureMinute: 640 }
        ])
      ],
      departureMinute: 590,
      dayType: 'weekday'
    });

    expect(options[0].legs).toHaveLength(2);
    expect(options[0].transferCount).toBe(1);
  });

  it('includes a transfer connector exactly 300 m long', () => {
    const longitudeAt300m = 2 * Math.asin(300 / (2 * 6_371_000)) * 180 / Math.PI;
    const exactTransfer = stop('exact-transfer', 0, 0.01 + longitudeAt300m);
    const options = planJourneys({
      stops: [...catalog, exactTransfer],
      originCandidates,
      destinationCandidates,
      trips: [
        trip('first', 'L1', [
          { stopId: 'origin', arrivalMinute: 600, departureMinute: 600 },
          { stopId: 'transfer-a', arrivalMinute: 620, departureMinute: 620 }
        ]),
        trip('second', 'L2', [
          { stopId: 'exact-transfer', arrivalMinute: 625, departureMinute: 625 },
          { stopId: 'destination', arrivalMinute: 640, departureMinute: 640 }
        ])
      ],
      departureMinute: 590,
      dayType: 'weekday'
    });

    expect(options[0].transferCount).toBe(1);
    expect(options[0].walkingMeters).toBeCloseTo(300, 5);
  });

  it('rejects transfers that cannot be walked or reached in time and caps changes at two', () => {
    const connectorTooFar = stop('far-transfer', 0, 0.02);
    const tooFarTrips = [
      trip('first', 'L1', [
        { stopId: 'origin', arrivalMinute: 600, departureMinute: 600 },
        { stopId: 'transfer-a', arrivalMinute: 620, departureMinute: 620 }
      ]),
      trip('second', 'L2', [
        { stopId: 'far-transfer', arrivalMinute: 621, departureMinute: 621 },
        { stopId: 'destination', arrivalMinute: 640, departureMinute: 640 }
      ])
    ];
    const tooFar = planJourneys({
      stops: [...catalog, connectorTooFar],
      originCandidates,
      destinationCandidates,
      trips: tooFarTrips.map((item) => item.tripId === 'second'
        ? { ...item, stops: item.stops.map((entry) => entry.stopId === 'far-transfer'
          ? { ...entry, stopId: connectorTooFar.id }
          : entry) }
        : item),
      departureMinute: 590,
      dayType: 'weekday'
    });
    expect(tooFar).toEqual([]);
  });

  it('allows at most two transfers', () => {
    const transferC = stop('transfer-c', 0, 0.012);
    const options = planJourneys({
      stops: [...catalog, transferC],
      originCandidates,
      destinationCandidates,
      trips: [
        trip('one', 'L1', [
          { stopId: 'origin', arrivalMinute: 600, departureMinute: 600 },
          { stopId: 'transfer-a', arrivalMinute: 620, departureMinute: 620 }
        ]),
        trip('two', 'L2', [
          { stopId: 'transfer-b', arrivalMinute: 625, departureMinute: 625 },
          { stopId: 'transfer-c', arrivalMinute: 640, departureMinute: 640 }
        ]),
        trip('three', 'L3', [
          { stopId: 'transfer-c', arrivalMinute: 645, departureMinute: 645 },
          { stopId: 'destination', arrivalMinute: 660, departureMinute: 660 }
        ]),
        trip('four', 'L4', [
          { stopId: 'transfer-a', arrivalMinute: 622, departureMinute: 622 },
          { stopId: 'transfer-b', arrivalMinute: 630, departureMinute: 630 }
        ])
      ],
      departureMinute: 590,
      dayType: 'weekday'
    });

    expect(options.every(({ transferCount }) => transferCount <= 2)).toBe(true);
    expect(options.some(({ legs }) => legs.map(({ tripId }) => tripId).join(',') === 'one,two,three')).toBe(true);
    expect(options.every(({ legs }) => legs.length <= 3)).toBe(true);
  });

  it('ignores trips for another day type and trips with invalid stop-time order', () => {
    const options = planJourneys({
      stops: catalog,
      originCandidates,
      destinationCandidates,
      trips: [
        { ...trip('wrong-day', 'L1', [
          { stopId: 'origin', arrivalMinute: 600, departureMinute: 600 },
          { stopId: 'destination', arrivalMinute: 630, departureMinute: 630 }
        ]), dayType: 'saturday' },
        trip('invalid', 'L2', [
          { stopId: 'origin', arrivalMinute: 620, departureMinute: 620 },
          { stopId: 'destination', arrivalMinute: 610, departureMinute: 610 }
        ]),
        { ...trip('unverified', 'L3', [
          { stopId: 'origin', arrivalMinute: 600, departureMinute: 600 },
          { stopId: 'destination', arrivalMinute: 630, departureMinute: 630 }
        ]), verified: false }
      ],
      departureMinute: 590,
      dayType: 'weekday'
    });

    expect(options).toEqual([]);
  });
});
