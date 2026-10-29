import type { ClockPort, MunicipalOperationResult } from '../../application/ports';
import type { LineStopDetail, MunicipalRoutePattern, NetworkStop } from '../../domain/types';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import type { MunicipalProfile } from '../config';
import { isMunicipalActionEnabled } from './action-readiness';
import type { MunicipalHttpClient } from './http-client';
import { isNumericId, isOpaqueId } from './request-validation';

const sourceName = 'Vigo municipal transit JSP';
const publishedTimePattern = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/u;
const scheduledTimePattern = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/u;

export interface LineStopMapping {
  min: 0;
  expectedTripIdPrefix?: string;
  evidenceRef: string;
  verification?: 'verified' | 'stakeholder-attested' | 'provisional';
}

type LineStopClient = Pick<MunicipalHttpClient, 'get'>;

export class MunicipalLineStopAdapter {
  constructor(
    private readonly client: LineStopClient,
    private readonly clock: ClockPort,
    private readonly profile: MunicipalProfile,
    private readonly mappings: Readonly<Record<string, LineStopMapping>> = {}
  ) {}

  async getLineStopDetail(
    stop: NetworkStop,
    lineCode: string
  ): Promise<MunicipalOperationResult<LineStopDetail>> {
    if (!isNumericId(stop.municipalCode) || !isOpaqueId(lineCode)) {
      return { kind: 'unavailable', reason: 'identity-unverified' };
    }
    const mapping = this.mappings[`${stop.municipalCode}:${lineCode}`];
    const provisional = mapping?.verification === 'provisional';
    if (
      !isMunicipalActionEnabled('TRANSPORTE_LINEA_INFO_PARADA', this.profile, {
        stop_id: stop.municipalCode,
        linea: lineCode
      })
      || (provisional && (
        this.profile !== 'fixture'
        || mapping?.min !== 0
        || mapping?.expectedTripIdPrefix !== lineCode
      ))
      || !mapping
      || mapping.min !== 0
      || !isOpaqueId(mapping.evidenceRef)
    ) {
      return { kind: 'unavailable', reason: 'mapping-unverified' };
    }

    let payload: unknown;
    try {
      payload = await this.client.get('TRANSPORTE_LINEA_INFO_PARADA', {
        stop_id: stop.municipalCode,
        linea: lineCode
      });
    } catch (error) {
      if (error instanceof MunicipalOperationError) {
        return { kind: 'unavailable', reason: error.reason };
      }
      throw error;
    }

    const normalized = normalizeLineStopPatterns(
      payload,
      stop.municipalCode,
      mapping.expectedTripIdPrefix
    );
    if (!normalized.ok) return { kind: 'unavailable', reason: normalized.reason };

    return {
      kind: 'success',
      value: {
        municipalCode: stop.municipalCode,
        lineCode,
        patterns: normalized.patterns,
        provenance: {
          kind: provisional ? 'provisional-fixture' : this.profile === 'fixture' ? 'fixture' : 'municipal',
          sourceName: provisional
            ? 'Synthetic provisional line-stop evaluation fixture'
            : this.profile === 'fixture' ? 'Synthetic municipal-contract fixture' : sourceName,
          fetchedAt: this.clock.now().toISOString(),
          evidenceRef: mapping.evidenceRef
        }
      }
    };
  }
}

type LineStopNormalization =
  | { ok: true; patterns: MunicipalRoutePattern[] }
  | { ok: false; reason: 'invalid' | 'identity-unverified' };

function normalizeLineStopPatterns(
  payload: unknown,
  municipalCode: string,
  expectedTripIdPrefix?: string
): LineStopNormalization {
  if (!Array.isArray(payload) || payload.length === 0 || payload.length > 10000) {
    return { ok: false, reason: 'invalid' };
  }

  const seenPatterns = new Set<string>();
  const patterns: MunicipalRoutePattern[] = [];
  for (const value of payload) {
    if (!isRecord(value)) return { ok: false, reason: 'invalid' };
    if (value['stop_id'] !== municipalCode) {
      return { ok: false, reason: 'identity-unverified' };
    }

    const tripId = value['trip_id'];
    const shapeId = value['shape_id'];
    const horarios = value['horarios'];
    const departureTimes = parsePublishedTimes(horarios);
    const scheduledTime = value['hora_programada'];
    const direction = value['direccion'];
    const sentido = value['sentido'];
    if (
      !isOpaqueId(tripId)
      || !isOpaqueId(shapeId)
      || !departureTimes
      || (scheduledTime !== undefined && (
        typeof scheduledTime !== 'string'
        || !scheduledTimePattern.test(scheduledTime)
      ))
      || (sentido !== undefined && (
        typeof sentido !== 'number'
        || !Number.isSafeInteger(sentido)
      ))
      || (direction !== undefined && !isText(direction))
    ) {
      return { ok: false, reason: 'invalid' };
    }
    if (expectedTripIdPrefix !== undefined && !hasLeadingTripToken(tripId, expectedTripIdPrefix)) {
      return { ok: false, reason: 'identity-unverified' };
    }

    const identity = JSON.stringify([tripId, shapeId]);
    if (seenPatterns.has(identity)) return { ok: false, reason: 'invalid' };
    seenPatterns.add(identity);
    patterns.push({
      tripId,
      shapeId,
      direction: typeof direction === 'string' ? direction : null,
      departureTimes
    });
  }

  return { ok: true, patterns };
}

function hasLeadingTripToken(tripId: string, expectedPrefix: string): boolean {
  const match = /^(\S+)\s+\S/u.exec(tripId);
  return match?.[1] === expectedPrefix;
}

function parsePublishedTimes(value: unknown): string[] | undefined {
  if (typeof value !== 'string' || value.length > 2048) return undefined;
  const times = value.split(',');
  return times.length > 0 && times.every((time) => publishedTimePattern.test(time))
    ? times
    : undefined;
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
