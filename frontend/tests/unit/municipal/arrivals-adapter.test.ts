import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import type { NetworkStop } from '../../../src/domain/types';
import { MunicipalArrivalsAdapter } from '../../../src/infrastructure/municipal/arrivals-adapter';
import { MunicipalHttpClient } from '../../../src/infrastructure/municipal/http-client';

const stop: NetworkStop = {
  id: 'app-stop-90',
  code: 'display-90',
  municipalCode: '2789',
  vitrasaId: '90',
  name: 'Synthetic stop',
  lat: 42.23,
  lon: -8.62,
  lineIds: []
};
const clock: ClockPort = {
  now: () => new Date('2026-10-27T12:00:00.000Z'),
  onDateChange: () => () => undefined
};

function adapterFor(response: Response | (() => Promise<Response>)) {
  const fetcher: typeof fetch = async (_input, _init) => (
    typeof response === 'function' ? response() : response
  );
  return new MunicipalArrivalsAdapter(new MunicipalHttpClient('fixture', fetcher), clock, 'fixture');
}

describe('municipal arrivals adapter failure mapping', () => {
  afterEach(() => vi.useRealTimers());

  it('distinguishes HTTP and rate-limit failures without reading raw bodies', async () => {
    await expect(adapterFor(new Response(null, { status: 429 })).getArrivals(stop))
      .resolves.toEqual({ kind: 'unavailable', reason: 'rate-limited' });
    await expect(adapterFor(new Response(null, { status: 503 })).getArrivals(stop))
      .resolves.toEqual({ kind: 'unavailable', reason: 'http' });
  });

  it('maps transport, timeout, HTML, and malformed JSON failures explicitly', async () => {
    const failingFetcher: typeof fetch = async () => { throw new TypeError('network failure'); };
    const transportAdapter = new MunicipalArrivalsAdapter(
      new MunicipalHttpClient('fixture', failingFetcher), clock, 'fixture'
    );
    await expect(transportAdapter.getArrivals(stop))
      .resolves.toEqual({ kind: 'unavailable', reason: 'transport' });

    vi.useFakeTimers();
    const hangingFetcher: typeof fetch = (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
    });
    const timeoutRequest = new MunicipalArrivalsAdapter(
      new MunicipalHttpClient('fixture', hangingFetcher), clock, 'fixture'
    ).getArrivals(stop);
    const timeoutResult = expect(timeoutRequest).resolves.toEqual({
      kind: 'unavailable',
      reason: 'timeout'
    });
    await vi.advanceTimersByTimeAsync(5000);
    await timeoutResult;

    await expect(adapterFor(new Response('<html>error</html>', {
      headers: { 'content-type': 'text/html; charset=utf-8' }
    })).getArrivals(stop)).resolves.toEqual({ kind: 'unavailable', reason: 'invalid' });
    await expect(adapterFor(new Response('{broken', {
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })).getArrivals(stop)).resolves.toEqual({ kind: 'unavailable', reason: 'invalid' });
  });

  it('rejects oversized bodies and never publishes partial estimates', async () => {
    await expect(adapterFor(new Response(new Uint8Array(262145), {
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })).getArrivals(stop)).resolves.toEqual({ kind: 'unavailable', reason: 'oversized' });

    const partialPayload = {
      parada: [{ stop_vitrasa: 90, nombre: 'Synthetic stop' }],
      estimaciones: [
        { linea: 'A', ruta: 'Valid first row', minutos: 3 },
        { linea: 'B', ruta: 'Invalid second row', minutos: -1 }
      ]
    };
    await expect(adapterFor(new Response(JSON.stringify(partialPayload), {
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })).getArrivals(stop)).resolves.toEqual({ kind: 'unavailable', reason: 'invalid' });
  });

  it('uses the verified arrivals GET in local-live and production profiles', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      parada: [{ stop_vitrasa: 90, nombre: 'Aeroporto de Peinador' }],
      estimaciones: [{ linea: 'A', ruta: 'Universidade', minutos: 8 }]
    }), {
      headers: { 'content-type': 'application/json; charset=utf-8' }
    }));

    for (const profile of ['local-live', 'production'] as const) {
      const adapter = new MunicipalArrivalsAdapter(new MunicipalHttpClient(profile, fetcher), clock, profile);
      await expect(adapter.getArrivals(stop)).resolves.toMatchObject({
        kind: 'success',
        value: {
          arrivals: [{ lineCode: 'A', destination: 'Universidade', minutes: 8 }],
          provenance: { kind: 'municipal' }
        }
      });
    }

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      'https://datos.vigo.org/vci_api_app/api2.jsp?tipo=TRANSPORTE-ESTIMACION-PARADA&id=90&ttl=5',
      expect.objectContaining({ method: 'GET', mode: 'cors', credentials: 'omit' })
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://datos.vigo.org/vci_api_app/api2.jsp?tipo=TRANSPORTE-ESTIMACION-PARADA&id=90&ttl=5',
      expect.objectContaining({ method: 'GET', mode: 'cors', credentials: 'omit' })
    );
  });
});
