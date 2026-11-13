import { MunicipalOperationError } from '../../domain/municipal-failures';
import type { MunicipalProfile } from '../config';
import { isMunicipalActionEnabled } from './action-readiness';
import { buildMunicipalRequest, type MunicipalAction } from './request-builder';
import { decodeMunicipalBytes } from './response-decoder';
import { RequestScheduler } from './request-scheduler';
import { MAX_RESPONSE_BYTES, readBoundedResponse } from '../http/bounded-response';
export { MAX_RESPONSE_BYTES, readBoundedResponse } from '../http/bounded-response';

export const MAX_ROWS_OR_POSITIONS = 10000;
export const MAX_IDENTIFIER_LENGTH = 128;
export const MAX_TEXT_LENGTH = 2048;
const OPERATION_DEADLINE_MS = 5000;

export class MunicipalHttpClient {
  private readonly fetcher: typeof fetch;

  constructor(
    private readonly profile: MunicipalProfile,
    fetcher?: typeof fetch,
    private readonly scheduler = new RequestScheduler()
  ) {
    if (profile === 'fixture' && !fetcher) {
      throw new Error('Fixture municipal clients require an injected fixture transport');
    }
    this.fetcher = fetcher ?? globalThis.fetch.bind(globalThis);
  }

  get(
    action: MunicipalAction,
    parameters: Readonly<Record<string, unknown>> = {},
    signal?: AbortSignal
  ): Promise<unknown> {
    const url = buildMunicipalRequest(action, parameters);
    if (!isMunicipalActionEnabled(action, this.profile, parameters)) {
      return Promise.reject(new MunicipalOperationError(
        'mapping-unverified',
        'Municipal action is not enabled for this profile'
      ));
    }
    return this.scheduler.schedule(url.toString(), (requestSignal) => (
      this.fetchPayload(url, requestSignal)
    ), signal);
  }

  private async fetchPayload(url: URL, requestSignal: AbortSignal): Promise<unknown> {
    const controller = new AbortController();
    let timedOut = false;
    const abortFromScheduler = () => controller.abort(requestSignal.reason);
    requestSignal.addEventListener('abort', abortFromScheduler, { once: true });
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, OPERATION_DEADLINE_MS);

    try {
      let response: Response;
      try {
        response = await this.fetcher(url.toString(), {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          redirect: 'error',
          referrerPolicy: 'no-referrer',
          signal: controller.signal
        });
      } catch (error) {
        if (error instanceof MunicipalOperationError) throw error;
        if (timedOut) throw new MunicipalOperationError('timeout', 'Municipal request timed out');
        if (requestSignal.aborted) throw requestSignal.reason;
        throw new MunicipalOperationError('transport', 'Municipal request failed');
      }

      if (!response.ok) {
        const reason = response.status === 429 ? 'rate-limited' : 'http';
        const failure = new MunicipalOperationError(reason, 'Municipal source returned an HTTP error', response.status);
        const cancellation = response.body?.cancel();
        if (cancellation) await cancellation.then(() => undefined, () => undefined);
        throw failure;
      }

      try {
        const bytes = await readBoundedResponse(response);
        const decoded = decodeMunicipalBytes(bytes, response.headers.get('content-type'));
        const payload: unknown = JSON.parse(decoded);
        assertPayloadLimits(payload);
        return payload;
      } catch (error) {
        if (timedOut) throw new MunicipalOperationError('timeout', 'Municipal request timed out');
        if (requestSignal.aborted) throw requestSignal.reason;
        if (error instanceof MunicipalOperationError) throw error;
        if (error instanceof RangeError) {
          throw new MunicipalOperationError('oversized', 'Municipal response exceeded a client limit');
        }
        throw new MunicipalOperationError('invalid', 'Municipal response was invalid');
      }
    } finally {
      clearTimeout(timeout);
      requestSignal.removeEventListener('abort', abortFromScheduler);
    }
  }
}

export function assertPayloadLimits(
  payload: unknown,
  limits: {
    maxRowsOrPositions?: number;
    maxIdentifierLength?: number;
    maxTextLength?: number;
  } = {}
): void {
  const maxRowsOrPositions = limits.maxRowsOrPositions ?? MAX_ROWS_OR_POSITIONS;
  const maxIdentifierLength = limits.maxIdentifierLength ?? MAX_IDENTIFIER_LENGTH;
  const maxTextLength = limits.maxTextLength ?? MAX_TEXT_LENGTH;
  const pending: Array<{ value: unknown; key: string | null }> = [{ value: payload, key: null }];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;
    const { value, key } = current;

    if (typeof value === 'string') {
      const length = Array.from(value).length;
      if (key === 'st_asgeojson') continue;
      if (key !== null && /^(id|.*_id|linea|lineCode|municipalCode|vitrasaId)$/i.test(key)) {
        if (length > maxIdentifierLength) throw new RangeError('Municipal response identifier exceeded the length limit');
      } else if (length > maxTextLength) {
        throw new RangeError('Municipal response text exceeded the length limit');
      }
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length > maxRowsOrPositions) {
        throw new RangeError('Municipal response exceeded the row or position limit');
      }
      for (const item of value) pending.push({ value: item, key: null });
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      for (const [childKey, childValue] of Object.entries(value)) {
        pending.push({ value: childValue, key: childKey });
      }
    }
  }
}
