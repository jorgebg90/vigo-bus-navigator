import type { MunicipalOperationResult } from '../../application/ports';
import type { NetworkStop } from '../../domain/types';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import type { MunicipalProfile } from '../config';
import { isMunicipalActionEnabled } from './action-readiness';
import type { MunicipalHttpClient } from './http-client';
import { MUNICIPAL_ACTIONS } from './request-builder';
import { isNumericId, isOpaqueId } from './request-validation';

export type StopIdentity = Pick<NetworkStop, 'id' | 'code' | 'vitrasaId' | 'lineIds'>;
type StopDetailClient = Pick<MunicipalHttpClient, 'get'>;

export class MunicipalStopDetailAdapter {
  constructor(
    private readonly client: StopDetailClient,
    private readonly profile: MunicipalProfile
  ) {}

  async getStop(
    identity: StopIdentity,
    signal?: AbortSignal
  ): Promise<MunicipalOperationResult<NetworkStop>> {
    if (!identity.vitrasaId || !isNumericId(identity.vitrasaId)) {
      return { kind: 'unavailable', reason: 'identity-unverified' };
    }
    const action = MUNICIPAL_ACTIONS[4];
    if (!isMunicipalActionEnabled(action, this.profile)) {
      return { kind: 'unavailable', reason: 'mapping-unverified' };
    }

    try {
      const payload = await this.client.get(action, { id: identity.vitrasaId }, signal);
      return { kind: 'success', value: normalizeStopDetail(payload, identity) };
    } catch (error) {
      if (error instanceof MunicipalOperationError) {
        return { kind: 'unavailable', reason: error.reason };
      }
      throw error;
    }
  }
}

export function normalizeStopDetail(payload: unknown, identity: StopIdentity): NetworkStop {
  if (!Array.isArray(payload) || payload.length !== 1) {
    throw new MunicipalOperationError('identity-unverified', 'Stop detail did not return exactly one record');
  }
  const record = payload[0];
  if (!isRecord(record)) {
    throw new MunicipalOperationError('invalid', 'Stop detail record was invalid');
  }

  const vitrasaId = canonicalNumericId(record['id']);
  const municipalCode = canonicalNumericId(record['stop_id']);
  const name = record['nombre'];
  if (!vitrasaId || vitrasaId !== identity.vitrasaId || !municipalCode) {
    throw new MunicipalOperationError('identity-unverified', 'Stop detail identity did not match the requested stop');
  }
  if (!isOpaqueId(identity.id) || !isOpaqueId(identity.code) || !isText(name, 2048)) {
    throw new MunicipalOperationError('invalid', 'Application stop identity or source name was invalid');
  }

  const { lat, lon } = normalizeCoordinates(record['lat'], record['lon']);
  return {
    id: identity.id,
    code: identity.code,
    municipalCode,
    vitrasaId,
    name,
    lat,
    lon,
    lineIds: [...identity.lineIds]
  };
}

function normalizeCoordinates(
  latitude: unknown,
  longitude: unknown
): { lat: number | null; lon: number | null } {
  if (latitude === undefined && longitude === undefined) return { lat: null, lon: null };
  if (latitude === null && longitude === null) return { lat: null, lon: null };
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new MunicipalOperationError('invalid', 'Stop coordinates must be present as a complete pair');
  }
  if (
    !Number.isFinite(latitude)
    || !Number.isFinite(longitude)
    || latitude < 42
    || latitude > 42.5
    || longitude < -9
    || longitude > -8.4
  ) {
    throw new MunicipalOperationError('invalid', 'Stop coordinates were outside the Vigo bounds');
  }
  return { lat: latitude, lon: longitude };
}

function canonicalNumericId(value: unknown): string | undefined {
  if (typeof value === 'string') return isNumericId(value) ? value : undefined;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
    const canonical = String(value);
    return isNumericId(canonical) ? canonical : undefined;
  }
  return undefined;
}

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string'
    && value.trim().length > 0
    && Array.from(value).length <= maxLength
    && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
