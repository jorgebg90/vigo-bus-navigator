import type { Language, NetworkLineSummary, Provenance } from '../../domain/types';
import type { ClockPort, MunicipalOperationResult } from '../../application/ports';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import type { MunicipalProfile } from '../config';
import { isMunicipalActionEnabled } from './action-readiness';
import type { MunicipalHttpClient } from './http-client';
import { MUNICIPAL_ACTIONS, type MunicipalAction } from './request-builder';
import { isOpaqueId } from './request-validation';

const validColor = /^#[0-9A-Fa-f]{6}$/;
const MAX_CATALOG_LINES = 10_000;

export interface LineCatalog {
  lines: NetworkLineSummary[];
  provenance: Provenance;
}

type LineCatalogClient = Pick<MunicipalHttpClient, 'get'>;

export class MunicipalLineCatalogAdapter {
  constructor(
    private readonly client: LineCatalogClient,
    private readonly clock: ClockPort,
    private readonly profile: MunicipalProfile
  ) {}

  async getCatalog(
    language: Language,
    signal?: AbortSignal
  ): Promise<MunicipalOperationResult<LineCatalog>> {
    const action = lineCatalogActionFor(language);
    if (!isMunicipalActionEnabled(action, this.profile)) {
      return { kind: 'unavailable', reason: 'mapping-unverified' };
    }

    try {
      const payload = await this.client.get(action, {}, signal);
      const lines = normalizeSourceLineRows(payload);
      const fetchedAt = this.clock.now().toISOString();
      if (!Number.isFinite(Date.parse(fetchedAt))) {
        throw new MunicipalOperationError('invalid', 'Municipal line catalog receipt timestamp was invalid');
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

export function lineCatalogActionFor(language: Language): MunicipalAction {
  return language === 'gl' ? MUNICIPAL_ACTIONS[1] : MUNICIPAL_ACTIONS[0];
}

export function normalizeLineCatalog(
  payload: unknown,
  fetchedAt: string,
  provenanceKind: 'municipal' | 'fixture' = 'municipal'
): LineCatalog {
  const lines = normalizeSourceLineRows(payload);
  if (!Number.isFinite(Date.parse(fetchedAt))) {
    throw new MunicipalOperationError('invalid', 'Municipal line catalog receipt timestamp was invalid');
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

export function normalizeSourceLineRows(payload: unknown): NetworkLineSummary[] {
  if (!Array.isArray(payload)) {
    throw new MunicipalOperationError('invalid', 'Municipal line catalog was not an array');
  }
  if (payload.length > MAX_CATALOG_LINES) {
    throw new MunicipalOperationError('oversized', 'Municipal line catalog exceeded the row limit');
  }

  const seenCodes = new Set<string>();
  return payload.map((value): NetworkLineSummary => {
    if (!isRecord(value)) {
      throw new MunicipalOperationError('invalid', 'Municipal line catalog row was invalid');
    }

    const code = value['linea'];
    const name = value['descripcion'];
    if (!isOpaqueId(code) || !isOpaqueId(name)) {
      throw new MunicipalOperationError('invalid', 'Municipal line identity or description was invalid');
    }
    if (seenCodes.has(code)) {
      throw new MunicipalOperationError('invalid', 'Municipal line catalog contained duplicate codes');
    }
    seenCodes.add(code);

    const line: NetworkLineSummary = {
      id: code,
      code,
      name,
      color: isColor(value['color']) ? value['color'] : '#666666'
    };
    if (isColor(value['color_texto'])) line.textColor = value['color_texto'];
    if (value['orden'] !== undefined) {
      if (typeof value['orden'] !== 'number' || !Number.isSafeInteger(value['orden'])) {
        throw new MunicipalOperationError('invalid', 'Municipal line display order was invalid');
      }
      line.displayOrder = value['orden'];
    }
    return line;
  });
}

function isColor(value: unknown): value is string {
  return typeof value === 'string' && validColor.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
