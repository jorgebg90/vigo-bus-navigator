import type { ClockPort, MunicipalArrivalsGateway, MunicipalOperationResult } from '../../application/ports';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import { isReceiptTimestampConsistent } from '../../domain/municipal-contract';
import type { ArrivalReceipt, NetworkStop } from '../../domain/types';
import type { MunicipalProfile } from '../config';
import { isMunicipalActionEnabled } from './action-readiness';
import type { MunicipalHttpClient } from './http-client';
import { normalizeArrivalPayload } from './arrivals-normalizer';

type ArrivalClient = Pick<MunicipalHttpClient, 'get'>;

export class MunicipalArrivalsAdapter implements MunicipalArrivalsGateway {
  constructor(
    private readonly client: ArrivalClient,
    private readonly clock: ClockPort,
    private readonly profile: MunicipalProfile
  ) {}

  async getArrivals(
    stop: NetworkStop
  ): Promise<MunicipalOperationResult<ArrivalReceipt>> {
    if (!stop.vitrasaId) return { kind: 'unavailable', reason: 'identity-unverified' };
    const action = 'TRANSPORTE-ESTIMACION-PARADA';
    if (!isMunicipalActionEnabled(action, this.profile)) {
      return { kind: 'unavailable', reason: 'mapping-unverified' };
    }

    try {
      const payload = await this.client.get(action, { id: stop.vitrasaId });
      const fetchedAt = this.clock.now().toISOString();
      const receipt: ArrivalReceipt = {
        stopId: stop.id,
        vitrasaId: stop.vitrasaId,
        fetchedAt,
        arrivals: normalizeArrivalPayload(payload, stop.vitrasaId),
        provenance: {
          kind: this.profile === 'fixture' ? 'fixture' : 'municipal',
          sourceName: this.profile === 'fixture' ? 'Synthetic municipal-contract fixture' : 'Vigo municipal JSP',
          fetchedAt
        }
      };
      if (!isReceiptTimestampConsistent(receipt)) {
        throw new MunicipalOperationError('invalid', 'Arrival receipt provenance timestamp did not match');
      }
      return { kind: 'success', value: receipt };
    } catch (error) {
      if (error instanceof MunicipalOperationError) {
        return { kind: 'unavailable', reason: error.reason };
      }
      throw error;
    }
  }
}
