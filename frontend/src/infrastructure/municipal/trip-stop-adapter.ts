import type { ClockPort, MunicipalOperationResult } from '../../application/ports';
import type { DayType, NetworkStop, TripStopSequence } from '../../domain/types';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import type { MunicipalProfile } from '../config';
import { isMunicipalActionEnabled } from './action-readiness';
import type { MunicipalHttpClient } from './http-client';
import { isNumericId, isOpaqueId } from './request-validation';

const sourceName = 'Vigo municipal transit JSP';

export interface TripMapping {
  lineCode: string;
  lineId?: string;
  dayType: DayType;
  tripId: string;
  evidenceRef: string;
  stopsByMunicipalCode: Readonly<Record<string, NetworkStop>>;
  verification?: 'verified' | 'stakeholder-attested' | 'provisional';
}

type TripStopClient = Pick<MunicipalHttpClient, 'get'>;

export class MunicipalTripStopAdapter {
  constructor(
    private readonly client: TripStopClient,
    private readonly clock: ClockPort,
    private readonly profile: MunicipalProfile,
    private readonly mappings: readonly TripMapping[] = []
  ) {}

  async getTripStops(
    lineCode: string,
    dayType: DayType,
    currentStopsByMunicipalCode?: Readonly<Record<string, NetworkStop>>
  ): Promise<MunicipalOperationResult<TripStopSequence>> {
    const mapping = this.mappings.find((item) => item.lineCode === lineCode && item.dayType === dayType);
    const provisional = mapping?.verification === 'provisional';
    if (
      !isMunicipalActionEnabled('TRANSPORTE_PARADAS_TRIP', this.profile, {
        id: mapping?.tripId
      })
      || (provisional && (
        this.profile !== 'fixture'
        || !mapping?.lineId
      ))
      || (this.profile === 'local-live' && !mapping?.lineId)
      || !isOpaqueId(lineCode)
      || !mapping
      || !isOpaqueId(mapping.tripId)
      || !isOpaqueId(mapping.evidenceRef)
    ) {
      return { kind: 'unavailable', reason: 'mapping-unverified' };
    }

    return this.fetchTripStops(
      lineCode,
      dayType,
      mapping.tripId,
      mapping.evidenceRef,
      currentStopsByMunicipalCode ?? mapping.stopsByMunicipalCode,
      provisional,
      provisional || mapping.lineId ? { lineCode, lineId: mapping.lineId } : undefined
    );
  }

  /** Online mode: loads the stop sequence of a source trip taken from the published line schedule. */
  getTripStopsById(
    lineCode: string,
    dayType: DayType,
    tripId: string,
    evidenceRef: string,
    stopsByMunicipalCode: Readonly<Record<string, NetworkStop>>
  ): Promise<MunicipalOperationResult<TripStopSequence>> {
    if (
      this.profile === 'fixture'
      || !isOpaqueId(lineCode)
      || !isOpaqueId(tripId)
      || !isOpaqueId(evidenceRef)
      || !isMunicipalActionEnabled('TRANSPORTE_PARADAS_TRIP', this.profile, { id: tripId })
    ) {
      return Promise.resolve({ kind: 'unavailable', reason: 'mapping-unverified' });
    }
    return this.fetchTripStops(lineCode, dayType, tripId, evidenceRef, stopsByMunicipalCode, false, undefined, true);
  }

  private async fetchTripStops(
    lineCode: string,
    dayType: DayType,
    tripId: string,
    evidenceRef: string,
    stopsByMunicipalCode: Readonly<Record<string, NetworkStop>>,
    provisional: boolean,
    expectedMembership?: { lineCode: string; lineId?: string },
    allowRepeatedStops = false
  ): Promise<MunicipalOperationResult<TripStopSequence>> {
    let payload: unknown;
    try {
      payload = await this.client.get('TRANSPORTE_PARADAS_TRIP', { id: tripId });
    } catch (error) {
      if (error instanceof MunicipalOperationError) {
        return { kind: 'unavailable', reason: error.reason };
      }
      throw error;
    }

    const stops = normalizeTripStops(
      payload,
      stopsByMunicipalCode,
      expectedMembership?.lineCode,
      expectedMembership?.lineId,
      allowRepeatedStops
    );
    if (!stops) return { kind: 'unavailable', reason: 'identity-unverified' };
    const fetchedAt = this.clock.now().toISOString();
    return {
      kind: 'success',
      value: {
        lineCode,
        dayType,
        tripId,
        stops,
        provenance: {
          kind: provisional ? 'provisional-fixture' : this.profile === 'fixture' ? 'fixture' : 'municipal',
          sourceName: provisional
            ? 'Synthetic provisional trip-stop evaluation fixture'
            : this.profile === 'fixture' ? 'Synthetic municipal-contract fixture' : sourceName,
          fetchedAt,
          evidenceRef
        }
      }
    };
  }
}

function normalizeTripStops(
  payload: unknown,
  stopsByMunicipalCode: Readonly<Record<string, NetworkStop>>,
  provisionalLineCode?: string,
  provisionalLineId?: string,
  allowRepeatedStops = false
): TripStopSequence['stops'] | undefined {
  if (!Array.isArray(payload) || payload.length === 0 || payload.length > 10000) return undefined;

  const seenSourceIds = new Set<number>();
  const seenSequences = new Set<number>();
  const seenStopIds = new Set<string>();
  const stops: TripStopSequence['stops'] = [];
  for (const [index, value] of payload.entries()) {
    if (!isRecord(value)) return undefined;
    const sourceId = value['id'];
    const municipalCode = value['stop_id'];
    const name = value['nombre'];
    const sequence = value['orden'];
    const latitude = value['lat'];
    const longitude = value['lon'];
    const lineas = value['lineas'];
    if (
      typeof sourceId !== 'number'
      || !Number.isSafeInteger(sourceId)
      || sourceId < 0
      || !isNumericId(municipalCode)
      || !isText(name)
      || typeof sequence !== 'number'
      || !Number.isSafeInteger(sequence)
      || sequence !== index + 1
      || !hasCoordinatePair(latitude, longitude)
      || !isText(lineas)
      || (!allowRepeatedStops && seenSourceIds.has(sourceId))
      || seenSequences.has(sequence)
    ) {
      return undefined;
    }
    const stop = stopsByMunicipalCode[municipalCode];
    if (
      !stop
      || stop.municipalCode !== municipalCode
      || (!allowRepeatedStops && seenStopIds.has(stop.id))
      || (provisionalLineCode !== undefined && (
        !provisionalLineId
        || !stop.lineIds.includes(provisionalLineId)
        || !lineMembershipContains(lineas, provisionalLineCode)
      ))
    ) return undefined;
    seenSourceIds.add(sourceId);
    seenSequences.add(sequence);
    seenStopIds.add(stop.id);
    stops.push({ sequence, stop });
  }

  function lineMembershipContains(value: string, lineCode: string): boolean {
    return value.split(/[,\s;|]+/u).some((candidate) => candidate === lineCode);
  }

  return stops.sort((left, right) => left.sequence - right.sequence);
}

function hasCoordinatePair(latitude: unknown, longitude: unknown): boolean {
  if (latitude === null && longitude === null) return true;
  return typeof latitude === 'number'
    && Number.isFinite(latitude)
    && latitude >= -90
    && latitude <= 90
    && typeof longitude === 'number'
    && Number.isFinite(longitude)
    && longitude >= -180
    && longitude <= 180;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string'
    && value.trim().length > 0
    && Array.from(value).length <= 2048
    && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value);
}
