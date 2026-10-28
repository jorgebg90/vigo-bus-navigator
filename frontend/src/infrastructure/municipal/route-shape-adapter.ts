import type { ClockPort, MunicipalOperationResult } from '../../application/ports';
import type { RouteGeometry, RouteShapeReceipt } from '../../domain/types';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import type { MunicipalProfile } from '../config';
import { isMunicipalActionEnabled } from './action-readiness';
import type { MunicipalHttpClient } from './http-client';
import { isOpaqueId } from './request-validation';

const sourceName = 'Vigo municipal transit JSP';
const maxCoordinates = 10000;

export interface ShapeMapping {
  shapeId: string;
  crs: string;
  evidenceRef: string;
  verification?: 'verified' | 'stakeholder-attested' | 'provisional';
}

type RouteShapeClient = Pick<MunicipalHttpClient, 'get'>;

export class MunicipalRouteShapeAdapter {
  constructor(
    private readonly client: RouteShapeClient,
    private readonly clock: ClockPort,
    private readonly profile: MunicipalProfile,
    private readonly mappings: Readonly<Record<string, ShapeMapping>> = {}
  ) {}

  async getRouteShape(lineCode: string): Promise<MunicipalOperationResult<RouteShapeReceipt>> {
    const mapping = this.mappings[lineCode];
    const provisional = mapping?.verification === 'provisional';
    if (
      !isMunicipalActionEnabled('TRANSPORTE_LINEA_GEOJSON', this.profile, {
        id: mapping?.shapeId
      })
      || (provisional && (
        this.profile !== 'fixture'
        || mapping?.crs !== 'OGC:CRS84'
      ))
      || !isOpaqueId(lineCode)
      || !mapping
      || !isOpaqueId(mapping.shapeId)
      || (mapping.crs !== 'EPSG:4326' && mapping.crs !== 'OGC:CRS84')
      || !isOpaqueId(mapping.evidenceRef)
    ) {
      return { kind: 'unavailable', reason: 'mapping-unverified' };
    }

    return this.fetchRouteShape(lineCode, mapping.shapeId, mapping.evidenceRef, provisional);
  }

  /** Online mode: loads the geometry of a source shape taken from the published line schedule. */
  getRouteShapeById(
    lineCode: string,
    shapeId: string,
    evidenceRef: string
  ): Promise<MunicipalOperationResult<RouteShapeReceipt>> {
    if (
      this.profile === 'fixture'
      || !isOpaqueId(lineCode)
      || !isOpaqueId(shapeId)
      || !isOpaqueId(evidenceRef)
      || !isMunicipalActionEnabled('TRANSPORTE_LINEA_GEOJSON', this.profile, { id: shapeId })
    ) {
      return Promise.resolve({ kind: 'unavailable', reason: 'mapping-unverified' });
    }
    return this.fetchRouteShape(lineCode, shapeId, evidenceRef, false);
  }

  private async fetchRouteShape(
    lineCode: string,
    shapeId: string,
    evidenceRef: string,
    provisional: boolean
  ): Promise<MunicipalOperationResult<RouteShapeReceipt>> {
    let payload: unknown;
    try {
      payload = await this.client.get('TRANSPORTE_LINEA_GEOJSON', { id: shapeId });
    } catch (error) {
      if (error instanceof MunicipalOperationError) {
        return { kind: 'unavailable', reason: error.reason };
      }
      throw error;
    }

    const geometry = normalizeRouteGeometry(payload);
    if (!geometry) return { kind: 'unavailable', reason: 'invalid' };
    const fetchedAt = this.clock.now().toISOString();
    return {
      kind: 'success',
      value: {
        lineCode,
        shapeId,
        crs: 'OGC:CRS84',
        geometry,
        provenance: {
          kind: provisional ? 'provisional-fixture' : this.profile === 'fixture' ? 'fixture' : 'municipal',
          sourceName: provisional
            ? 'Synthetic provisional geometry evaluation fixture'
            : this.profile === 'fixture' ? 'Synthetic municipal-contract fixture' : sourceName,
          fetchedAt,
          evidenceRef
        }
      }
    };
  }
}

export function normalizeRouteGeometry(payload: unknown): RouteGeometry | undefined {
  if (!Array.isArray(payload) || payload.length !== 1) return undefined;
  const row = payload[0];
  if (!isRecord(row) || typeof row['st_asgeojson'] !== 'string') return undefined;

  let geometry: unknown;
  try {
    geometry = JSON.parse(row['st_asgeojson']) as unknown;
  } catch {
    return undefined;
  }
  if (
    !isRecord(geometry)
    || geometry['type'] !== 'LineString'
    || Object.keys(geometry).length !== 2
    || !Object.hasOwn(geometry, 'coordinates')
  ) {
    return undefined;
  }
  const rawCoordinates = geometry['coordinates'];
  if (
    !Array.isArray(rawCoordinates)
    || rawCoordinates.length < 2
    || rawCoordinates.length > maxCoordinates
  ) {
    return undefined;
  }

  const coordinates: Array<[number, number]> = [];
  for (const rawCoordinate of rawCoordinates) {
    if (
      !Array.isArray(rawCoordinate)
      || rawCoordinate.length !== 2
      || typeof rawCoordinate[0] !== 'number'
      || typeof rawCoordinate[1] !== 'number'
      || !Number.isFinite(rawCoordinate[0])
      || !Number.isFinite(rawCoordinate[1])
      || rawCoordinate[0] < -180
      || rawCoordinate[0] > 180
      || rawCoordinate[1] < -90
      || rawCoordinate[1] > 90
    ) {
      return undefined;
    }
    coordinates.push([rawCoordinate[0], rawCoordinate[1]]);
  }

  return { type: 'LineString', coordinates };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
