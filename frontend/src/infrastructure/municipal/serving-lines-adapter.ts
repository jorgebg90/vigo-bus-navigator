import type { ClockPort, MunicipalOperationResult } from '../../application/ports';
import type { NetworkLineSummary, NetworkStop, Provenance } from '../../domain/types';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import type { MunicipalProfile } from '../config';
import { isMunicipalActionEnabled } from './action-readiness';
import type { MunicipalHttpClient } from './http-client';
import { normalizeSourceLineRows } from './line-catalog-adapter';
import { MUNICIPAL_ACTIONS } from './request-builder';
import { isNumericId } from './request-validation';

export interface ServingLines {
  municipalCode: string;
  lines: NetworkLineSummary[];
  provenance: Provenance;
}

type ServingLinesClient = Pick<MunicipalHttpClient, 'get'>;

export class MunicipalServingLinesAdapter {
  constructor(
    private readonly client: ServingLinesClient,
    private readonly clock: ClockPort,
    private readonly profile: MunicipalProfile
  ) {}

  async getServingLines(
    stop: NetworkStop,
    signal?: AbortSignal
  ): Promise<MunicipalOperationResult<ServingLines>> {
    if (!isNumericId(stop.municipalCode)) {
      return { kind: 'unavailable', reason: 'identity-unverified' };
    }
    const action = MUNICIPAL_ACTIONS[5];
    if (!isMunicipalActionEnabled(action, this.profile)) {
      return { kind: 'unavailable', reason: 'mapping-unverified' };
    }

    try {
      const payload = await this.client.get(action, { id: stop.municipalCode }, signal);
      const lines = normalizeSourceLineRows(payload);
      const fetchedAt = this.clock.now().toISOString();
      if (!Number.isFinite(Date.parse(fetchedAt))) {
        throw new MunicipalOperationError('invalid', 'Serving-lines receipt timestamp was invalid');
      }
      return {
        kind: 'success',
        value: {
          municipalCode: stop.municipalCode,
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
