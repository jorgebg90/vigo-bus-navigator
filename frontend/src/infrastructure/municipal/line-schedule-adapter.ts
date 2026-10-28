import type { LineScheduleGateway, MunicipalOperationResult, ClockPort } from '../../application/ports';
import type { DayType, PublishedLineSchedule, PublishedTrip } from '../../domain/types';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import type { MunicipalProfile } from '../config';
import { isMunicipalActionEnabled } from './action-readiness';
import { isOpaqueId } from './request-validation';
import { MunicipalHttpClient } from './http-client';

const publishedTimePattern = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
const sourceLineIdentityKeys = ['linea', 'line_code'] as const;
const sourceName = 'Vigo municipal transit JSP';
const departureSeparator = /, ?/u;
const sourceDayCodes: Readonly<Record<DayType, string>> = { weekday: '1', saturday: '6', sunday_holiday: '0' };

export interface ScheduleMapping {
  scheduleId: string;
  evidenceRef: string;
  dayCodes: Readonly<Partial<Record<DayType, string>>>;
  verification?: 'verified' | 'stakeholder-attested' | 'provisional';
  mixedLineRows?: 'filter-by-leading-line-code' | 'keep-all';
}

/** Mirrors the official app: the public line code is the schedule ID and every returned row belongs to the line. */
export interface OnlineLineSchedulePolicy {
  evidenceRef: string;
}

export class MunicipalLineScheduleAdapter implements LineScheduleGateway {
  constructor(
    private readonly client: MunicipalHttpClient,
    private readonly clock: ClockPort,
    private readonly profile: MunicipalProfile,
    private readonly mappings: Readonly<Record<string, ScheduleMapping>> = {},
    private readonly onlinePolicy?: OnlineLineSchedulePolicy
  ) {}

  private resolveMapping(lineCode: string): ScheduleMapping | undefined {
    const exact = this.mappings[lineCode];
    if (exact || !this.onlinePolicy || this.profile === 'fixture') return exact;
    return {
      scheduleId: lineCode,
      evidenceRef: this.onlinePolicy.evidenceRef,
      dayCodes: sourceDayCodes,
      verification: 'verified',
      mixedLineRows: 'keep-all'
    };
  }

  async getLineSchedule(
    lineCode: string,
    dayType: DayType
  ): Promise<MunicipalOperationResult<PublishedLineSchedule>> {
    const mapping = this.resolveMapping(lineCode);
    const sourceDay = mapping?.dayCodes[dayType];
    const provisional = mapping?.verification === 'provisional';
    if (
      !mapping
      || !isMunicipalActionEnabled('TRANSPORTE_LINEA_HORARIOS_EXTEND', this.profile, {
        id: mapping.scheduleId,
        dia: sourceDay
      })
      || (provisional && (
        this.profile !== 'fixture'
        || mapping.scheduleId !== lineCode
        || mapping.dayCodes.weekday !== '1'
        || mapping.dayCodes.saturday !== '6'
        || mapping.dayCodes.sunday_holiday !== '0'
      ))
      || !isOpaqueId(lineCode)
      || !isOpaqueId(mapping.scheduleId)
      || typeof mapping.evidenceRef !== 'string'
      || mapping.evidenceRef.trim().length === 0
      || !sourceDay
      || !['0', '1', '6'].includes(sourceDay)
    ) {
      return { kind: 'unavailable', reason: 'mapping-unverified' };
    }

    let payload: unknown;
    try {
      payload = await this.client.get('TRANSPORTE_LINEA_HORARIOS_EXTEND', {
        id: mapping.scheduleId,
        dia: sourceDay
      });
    } catch (error) {
      if (error instanceof MunicipalOperationError) {
        return { kind: 'unavailable', reason: error.reason };
      }
      throw error;
    }

    const keepsAllRows = mapping.mixedLineRows === 'keep-all';
    const trips = keepsAllRows ? normalizePublishedTrips(payload) : undefined;
    const departures = keepsAllRows
      ? trips && [...new Set(trips.flatMap((trip) => trip.departures))].sort()
      : normalizePublishedDepartures(
          payload,
          lineCode,
          provisional,
          mapping.mixedLineRows === 'filter-by-leading-line-code'
        );
    // In keep-all mode an empty source array is a valid "no service on this day type" answer.
    if (!departures || (departures.length === 0 && !keepsAllRows)) return { kind: 'unavailable', reason: 'invalid' };

    const fetchedAt = this.clock.now().toISOString();
    const isFixture = this.profile === 'fixture';
    return {
      kind: 'success',
      value: {
        lineCode,
        dayType,
        scheduleId: mapping.scheduleId,
        departures,
        ...(trips ? { trips } : {}),
        provenance: {
          kind: provisional ? 'provisional-fixture' : isFixture ? 'fixture' : 'municipal',
          sourceName: provisional
            ? 'Synthetic provisional schedule evaluation fixture'
            : isFixture ? 'Synthetic municipal-contract fixture' : sourceName,
          fetchedAt,
          evidenceRef: mapping.evidenceRef
        }
      }
    };
  }
}

function normalizePublishedDepartures(
  payload: unknown,
  lineCode: string,
  provisional: boolean,
  filterMixedLines: boolean
): string[] | undefined {
  if (!Array.isArray(payload) || payload.length === 0 || payload.length > 10000) return undefined;

  const departures: string[] = [];
  const seenTrips = new Set<string>();
  const seenRows = new Set<string>();
  for (const row of payload) {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) return undefined;
    const sourceRow = row as Record<string, unknown>;
    if (!isOpaqueId(sourceRow.trip_id)) return undefined;
    if (provisional || filterMixedLines) {
      const lineToken = sourceRow.trip_id.trimStart().match(/^([A-Za-z0-9]+)(?=\s|$)/u)?.[1];
      if (!lineToken) return undefined;
      if (lineToken !== lineCode) continue;
    } else {
      seenTrips.add(sourceRow.trip_id);
      if (seenTrips.size > 1) return undefined;
    }
    if (!isOpaqueId(sourceRow.shape_id) || typeof sourceRow.horarios !== 'string') return undefined;

    const rowIdentity = JSON.stringify([sourceRow.trip_id, sourceRow.shape_id]);
    if (seenRows.has(rowIdentity)) return undefined;
    seenRows.add(rowIdentity);

    for (const key of sourceLineIdentityKeys) {
      const sourceLineCode = sourceRow[key];
      if (sourceLineCode !== undefined && sourceLineCode !== lineCode) return undefined;
    }

    const rowDepartures = sourceRow.horarios.split(departureSeparator);
    if (rowDepartures.length === 0 || rowDepartures.some((time) => !publishedTimePattern.test(time))) {
      return undefined;
    }
    departures.push(...rowDepartures);
  }

  return departures.length > 0
    ? provisional || filterMixedLines ? departures.sort() : departures
    : undefined;
}

function normalizePublishedTrips(payload: unknown): PublishedTrip[] | undefined {
  if (!Array.isArray(payload) || payload.length > 10000) return undefined;

  const trips: PublishedTrip[] = [];
  const seenRows = new Set<string>();
  for (const row of payload) {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) return undefined;
    const {
      trip_id: tripId,
      shape_id: shapeId,
      dir: direction,
      direccion: headsign,
      inicio_s: origin,
      fin_s: destination,
      horarios,
      activo
    } = row as Record<string, unknown>;
    if (
      !isOpaqueId(tripId)
      || !isOpaqueId(shapeId)
      || (direction !== 0 && direction !== 1)
      || !isOpaqueId(headsign)
      || typeof horarios !== 'string'
    ) {
      return undefined;
    }
    const rowIdentity = JSON.stringify([tripId, shapeId]);
    if (seenRows.has(rowIdentity)) return undefined;
    seenRows.add(rowIdentity);

    const departures = horarios.trim().length === 0 ? [] : horarios.split(departureSeparator);
    if (departures.some((time) => !publishedTimePattern.test(time))) return undefined;
    trips.push({
      tripId,
      shapeId,
      direction,
      headsign: headsign.trim(),
      origin: isOpaqueId(origin) ? origin.trim() : null,
      destination: isOpaqueId(destination) ? destination.trim() : null,
      departures,
      active: activo === 1
    });
  }
  return trips;
}
