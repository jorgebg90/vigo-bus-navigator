import { describe, expect, it, vi } from 'vitest';
import { assertPayloadLimits, MunicipalHttpClient, readBoundedResponse } from '../../../src/infrastructure/municipal/http-client';

describe('bounded municipal responses', () => {
  it('accepts a response exactly at the byte limit', async () => {
    const bytes = new Uint8Array(262144);
    const response = new Response(bytes);
    expect((await readBoundedResponse(response)).byteLength).toBe(262144);
  });

  it('cancels the response body and rejects when the streamed byte limit is exceeded', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(262145));
      },
      cancel() {
        cancelled = true;
      }
    });

    await expect(readBoundedResponse(new Response(body))).rejects.toThrow(/size limit/i);
    expect(cancelled).toBe(true);
  });

  it('rejects a declared oversized body before reading and cancels it', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true;
      }
    });

    await expect(readBoundedResponse(new Response(body, {
      headers: { 'content-length': '262145' }
    }))).rejects.toThrow(/size limit/i);
    expect(cancelled).toBe(true);
  });

  it('accepts exactly 10000 rows and rejects excess rows, long identifiers, and long text', () => {
    expect(() => assertPayloadLimits(Array.from({ length: 10000 }, () => ({})))).not.toThrow();
    expect(() => assertPayloadLimits(Array.from({ length: 10001 }, () => ({})))).toThrow(/row or position/i);
    expect(() => assertPayloadLimits({ trip_id: 'x'.repeat(129) })).toThrow(/identifier/i);
    expect(() => assertPayloadLimits({ nombre: 'x'.repeat(2049) })).toThrow(/text/i);
  });

  it('aborts a stalled fetch at the five-second total deadline and reports timeout', async () => {
    vi.useFakeTimers();
    const fetcher: typeof fetch = (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
    });
    const client = new MunicipalHttpClient('production', fetcher);
    const request = client.get('TRANSPORTE_LINEAS_ES');
    const timeoutRejection = expect(request).rejects.toMatchObject({ reason: 'timeout' });

    try {
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(5000);
      await timeoutRejection;
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses the fixed browser GET policy and parses a bounded declared response', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(
      new TextEncoder().encode('[{"linea":"A","descripcion":"Example"}]'),
      { headers: { 'content-type': 'application/json; charset=utf-8' } }
    ));
    const client = new MunicipalHttpClient('production', fetcher);

    await expect(client.get('TRANSPORTE_LINEAS_ES')).resolves.toEqual([
      { linea: 'A', descripcion: 'Example' }
    ]);
    expect(fetcher).toHaveBeenCalledWith(
      'https://datos.vigo.org/vci_api_app/api2.jsp?tipo=TRANSPORTE_LINEAS_ES',
      expect.objectContaining({
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer'
      })
    );
  });

  it('invokes the default browser fetch with the global receiver', async () => {
    const fetcher = vi.fn(function (this: typeof globalThis) {
      expect(this).toBe(globalThis);
      return Promise.resolve(new Response('[]', {
        headers: { 'content-type': 'application/json; charset=utf-8' }
      }));
    });
    vi.stubGlobal('fetch', fetcher);

    try {
      await expect(new MunicipalHttpClient('production').get('TRANSPORTE_LINEAS_ES')).resolves.toEqual([]);
      expect(fetcher).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('allows online catalog actions for any valid identifier in production at the HTTP boundary', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response('[]', {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    }));
    const client = new MunicipalHttpClient('production', fetcher);
    const onlineActions = [
      ['TRANSPORTE_PARADAS', {}],
      ['TRANSPORTE_LINEA_HORARIOS_EXTEND', { id: '4C', dia: '1' }],
      ['TRANSPORTE_LINEA_GEOJSON', { id: 'Route_664' }],
      ['TRANSPORTE_PARADAS_TRIP', { id: 'L4 02LP101_004002_6' }],
      ['TRANSPORTE_LINEA_INFO_PARADA', { stop_id: '2789', linea: 'A' }]
    ] as const;

    await expect(Promise.all(onlineActions.map(([action, parameters]) => (
      client.get(action, parameters)
    )))).resolves.toEqual(onlineActions.map(() => []));
    expect(fetcher).toHaveBeenCalledTimes(onlineActions.length);
  }, 15000);

  it('blocks non-validated line-stop detail parameters in local-live and production', async () => {
    const fetcher = vi.fn<typeof fetch>();
    for (const profile of ['local-live', 'production'] as const) {
      await expect(new MunicipalHttpClient(profile, fetcher).get('TRANSPORTE_LINEA_INFO_PARADA', {
        stop_id: '2790',
        linea: 'A'
      })).rejects.toMatchObject({ reason: 'mapping-unverified' });
    }

    expect(fetcher).not.toHaveBeenCalled();
  });
});
