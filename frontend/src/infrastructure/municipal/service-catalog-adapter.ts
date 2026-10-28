import type { ClockPort, MunicipalOperationResult } from '../../application/ports';
import type { Language, NetworkLineSummary, Provenance } from '../../domain/types';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import type { MunicipalProfile } from '../config';
import { isMunicipalActionEnabled } from './action-readiness';
import type { MunicipalHttpClient } from './http-client';
import type { LineCatalog } from './line-catalog-adapter';
import { MUNICIPAL_ACTIONS, type MunicipalAction } from './request-builder';
import { isOpaqueId } from './request-validation';

const validColor = /^#[0-9A-Fa-f]{6}$/;
const MAX_SERVICE_ROWS = 10_000;

export interface ServiceCatalog {
  lines: NetworkLineSummary[];
  provenance: Provenance;
}

type ServiceCatalogClient = Pick<MunicipalHttpClient, 'get'>;

export class MunicipalServiceCatalogAdapter {
  constructor(
    private readonly client: ServiceCatalogClient,
    private readonly clock: ClockPort,
    private readonly profile: MunicipalProfile
  ) {}

  async getCatalog(
    language: Language,
    signal?: AbortSignal
  ): Promise<MunicipalOperationResult<ServiceCatalog>> {
    const action = serviceCatalogActionFor(language);
    if (!isMunicipalActionEnabled(action, this.profile)) {
      return { kind: 'unavailable', reason: 'mapping-unverified' };
    }

    try {
      const payload = await this.client.get(action, {}, signal);
      const lines = normalizeServiceRows(payload);
      const fetchedAt = this.clock.now().toISOString();
      if (!Number.isFinite(Date.parse(fetchedAt))) {
        throw new MunicipalOperationError('invalid', 'Municipal service catalog receipt timestamp was invalid');
      }
      return {
        kind: 'success',
        value: {
          lines,
          provenance: {
            kind: this.profile === 'fixture' ? 'fixture' : 'municipal',
            sourceName: this.profile === 'fixture'
              ? 'Synthetic municipal-contract fixture'
              : 'Vigo municipal JSP',
            fetchedAt
          }
        }
      };
    } catch (error) {
      if (error instanceof MunicipalOperationError) {
        return { kind: 'unavailable', reason: error.reason };
      }
      throw error;
    }
  }
}

export function serviceCatalogActionFor(language: Language): MunicipalAction {
  return language === 'gl' ? MUNICIPAL_ACTIONS[3] : MUNICIPAL_ACTIONS[2];
}

export function normalizeServiceCatalog(
  payload: unknown,
  fetchedAt: string,
  provenanceKind: 'municipal' | 'fixture' = 'municipal'
): ServiceCatalog {
  const lines = normalizeServiceRows(payload);
  if (!Number.isFinite(Date.parse(fetchedAt))) {
    throw new MunicipalOperationError('invalid', 'Municipal service catalog receipt timestamp was invalid');
  }
  return {
    lines,
    provenance: {
      kind: provenanceKind,
      sourceName: provenanceKind === 'fixture'
        ? 'Synthetic municipal-contract fixture'
        : 'Vigo municipal JSP',
      fetchedAt
    }
  };
}

export function joinServiceMetadata(
  lineCatalog: LineCatalog,
  serviceCatalog: ServiceCatalog
): LineCatalog {
  const serviceByCode = new Map(serviceCatalog.lines.map((line) => [line.code, line]));
  return {
    ...lineCatalog,
    lines: lineCatalog.lines.map((line) => {
      const service = serviceByCode.get(line.code);
      if (!service) return line;
      return {
        ...line,
        ...(service.serviceType === undefined ? {} : { serviceType: service.serviceType }),
        ...(service.serviceSubtype === undefined ? {} : { serviceSubtype: service.serviceSubtype })
      };
    })
  };
}

function normalizeServiceRows(payload: unknown): NetworkLineSummary[] {
  if (!Array.isArray(payload)) {
    throw new MunicipalOperationError('invalid', 'Municipal service catalog was not an array');
  }
  if (payload.length > MAX_SERVICE_ROWS) {
    throw new MunicipalOperationError('oversized', 'Municipal service catalog exceeded the row limit');
  }

  const seenCodes = new Set<string>();
  return payload.map((value): NetworkLineSummary => {
    if (!isRecord(value)) {
      throw new MunicipalOperationError('invalid', 'Municipal service catalog row was invalid');
    }
    const code = value['linea'];
    const name = value['descripcion'];
    if (!isOpaqueId(code) || !isText(name, 2048)) {
      throw new MunicipalOperationError('invalid', 'Municipal service identity or description was invalid');
    }
    if (seenCodes.has(code)) {
      throw new MunicipalOperationError('invalid', 'Municipal service catalog contained duplicate line codes');
    }
    seenCodes.add(code);

    const line: NetworkLineSummary = {
      id: code,
      code,
      name,
      color: isColor(value['color']) ? value['color'] : '#666666'
    };
    if (value['tipo'] !== undefined) {
      if (!isText(value['tipo'], 2048)) {
        throw new MunicipalOperationError('invalid', 'Municipal service type was invalid');
      }
      line.serviceType = value['tipo'];
    }
    if (value['subtipo'] !== undefined) {
      if (!isText(value['subtipo'], 2048)) {
        throw new MunicipalOperationError('invalid', 'Municipal service subtype was invalid');
      }
      line.serviceSubtype = value['subtipo'];
    }
    return line;
  });
}

function isColor(value: unknown): value is string {
  return typeof value === 'string' && validColor.test(value);
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
