import type { Arrival } from '../../domain/types';
import type { ArrivalsGateway, ArrivalsResult, DataStatus } from '../../application/ports';

interface ArrivalsPayload {
  stopId?: string;
  generatedAt?: string;
  dataStatus?: DataStatus;
  arrivals?: Arrival[];
  error?: { code?: string };
}

/** Maps API contract v3.0.0 onto the ArrivalsGateway port. */
export class HttpArrivalsGateway implements ArrivalsGateway {
  constructor(private readonly baseUrl: string, private readonly fetcher: typeof fetch = fetch) {}

  async getArrivals(stopCode: string): Promise<ArrivalsResult> {
    let response: Response;
    try {
      response = await this.fetcher(`${this.baseUrl.replace(/\/$/, '')}/stops/${encodeURIComponent(stopCode)}/arrivals`);
    } catch {
      return { kind: 'unavailable', reason: typeof window !== 'undefined' && !navigator.onLine ? 'offline' : 'upstream' };
    }
    const payload = await response.json().catch(() => ({})) as ArrivalsPayload;
    if (!response.ok) {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return { kind: 'unavailable', reason: 'offline' };
      }
      const reason = payload.error?.code === 'STOP_NOT_EXIST' ? 'stop-not-exist'
        : response.status === 400 || response.status === 405 ? 'unknown'
        : 'upstream';
      return { kind: 'unavailable', reason };
    }
    if (!payload.arrivals || !payload.dataStatus) return { kind: 'unavailable', reason: 'unknown' };
    return {
      kind: 'live',
      arrivals: payload.arrivals,
      fetchedAt: payload.generatedAt ?? new Date().toISOString(),
      dataStatus: payload.dataStatus
    };
  }
}
