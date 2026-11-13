import { describe, expect, it, vi } from 'vitest';
import { MunicipalGeocoder } from '../../../src/infrastructure/geocoding/municipal-geocoder';

const response = (features: unknown[]) => new Response(JSON.stringify({
  type: 'FeatureCollection',
  features
}), { status: 200, headers: { 'content-type': 'application/json' } });

const feature = (longitude: number, latitude: number, properties: Record<string, unknown> = {
  gid: 'custom:street:123',
  layer: 'street',
  name: 'Rúa do Príncipe',
  label: 'Rúa do Príncipe, Vigo, GA, Spain'
}) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [longitude, latitude] },
  properties
});

describe('MunicipalGeocoder', () => {
  it('uses the municipal planner autocomplete and returns only valid in-area suggestions', async () => {
    const fetcher: typeof fetch = vi.fn(async () => response([
      feature(-8.72, 42.24),
      feature(-8.9, 42.24),
      { ...feature(-8.72, 42.24), geometry: { type: 'LineString', coordinates: [] } }
    ]));
    const result = await new MunicipalGeocoder(fetcher).searchAddresses('Rúa do Príncipe');
    expect(result).toEqual({
      kind: 'success',
      suggestions: [{
        id: 'custom:street:123',
        label: 'Rúa do Príncipe, Vigo, GA, Spain',
        point: { latitude: 42.24, longitude: -8.72 }
      }]
    });

    const [requestUrl, requestInit] = vi.mocked(fetcher).mock.calls[0];
    const url = new URL(String(requestUrl));
    expect(url.origin + url.pathname).toBe('https://planificador-rutas-api.vigo.org/v1/autocomplete');
    expect([...url.searchParams]).toEqual([
      ['text', 'Rúa do Príncipe'], ['layers', 'venue,street'], ['lang', 'es']
    ]);
    expect(requestInit).toMatchObject({
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      cache: 'no-store'
    });
  });

  it('classifies provider, malformed, and oversized responses explicitly', async () => {
    const httpFailure: typeof fetch = vi.fn(async () => new Response('', { status: 429 }));
    await expect(new MunicipalGeocoder(httpFailure).searchAddresses('Vigo'))
      .resolves.toEqual({ kind: 'unavailable', reason: 'http' });

    const invalidJson: typeof fetch = vi.fn(async () => new Response('{'));
    await expect(new MunicipalGeocoder(invalidJson).searchAddresses('Vigo'))
      .resolves.toEqual({ kind: 'unavailable', reason: 'invalid' });

    const oversized: typeof fetch = vi.fn(async () => new Response(' '.repeat(262_145)));
    await expect(new MunicipalGeocoder(oversized).searchAddresses('Vigo'))
      .resolves.toEqual({ kind: 'unavailable', reason: 'oversized' });
  });

  it('honors caller cancellation', async () => {
    const fetcher: typeof fetch = vi.fn(async (_input, init) => {
      if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      throw new TypeError('Network request aborted');
    });
    const cancellation = {
      isCancelled: () => true,
      onCancelled: (listener: () => void) => {
        listener();
        return () => undefined;
      }
    };
    await expect(new MunicipalGeocoder(fetcher).searchAddresses('Vigo', cancellation))
      .resolves.toEqual({ kind: 'cancelled' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('keeps provider order, accepts venues and limits to five distinct valid suggestions', async () => {
    const features = Array.from({ length: 7 }, (_, index) => feature(-8.72, 42.24, {
      gid: `custom:venue:${index}`, layer: 'venue', name: `Lugar ${index}`
    }));
    const fetcher: typeof fetch = vi.fn(async () => response([
      feature(-8.9, 42.24),
      feature(-8.72, 42.24, { gid: 'bad-layer', layer: 'country', label: 'Spain' }),
      feature(-8.72, 42.24, { layer: 'street', label: 'Missing ID' }),
      feature(-8.72, 42.24, { gid: 'missing-label', layer: 'street' }),
      features[0], ...features
    ]));
    const result = await new MunicipalGeocoder(fetcher).searchAddresses('Lugar');
    expect(result.kind).toBe('success');
    if (result.kind !== 'success') throw new Error('Expected suggestions');
    expect(result.suggestions.map(({ id, label }) => ({ id, label }))).toEqual(
      Array.from({ length: 5 }, (_, index) => ({ id: `custom:venue:${index}`, label: `Lugar ${index}` }))
    );
  });

  it('distinguishes malformed envelopes from a valid empty collection', async () => {
    for (const payload of [null, {}, { type: 'FeatureCollection', features: {} }, { type: 'Other', features: [] }]) {
      await expect(new MunicipalGeocoder(async () => Response.json(payload)).searchAddresses('Vigo'))
        .resolves.toEqual({ kind: 'unavailable', reason: 'invalid' });
    }
    await expect(new MunicipalGeocoder(async () => response([])).searchAddresses('Vigo'))
      .resolves.toEqual({ kind: 'success', suggestions: [] });
  });

  it('discards a response received after cancellation even if fetch ignores the signal', async () => {
    let cancelled = false;
    const cancellation = {
      isCancelled: () => cancelled,
      onCancelled: () => () => undefined
    };
    const fetcher: typeof fetch = vi.fn(async () => {
      cancelled = true;
      return response([feature(-8.72, 42.24)]);
    });
    await expect(new MunicipalGeocoder(fetcher).searchAddresses('Vigo', cancellation))
      .resolves.toEqual({ kind: 'cancelled' });
  });

  it('bounds slow requests and reports network failures without hiding unexpected errors', async () => {
    vi.useFakeTimers();
    try {
      const fetcher: typeof fetch = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }));
      const pending = new MunicipalGeocoder(fetcher).searchAddresses('Vigo');
      await vi.advanceTimersByTimeAsync(5_000);
      await expect(pending).resolves.toEqual({ kind: 'unavailable', reason: 'network' });
      await expect(new MunicipalGeocoder(async () => { throw new TypeError('Network'); }).searchAddresses('Vigo'))
        .resolves.toEqual({ kind: 'unavailable', reason: 'network' });
      await expect(new MunicipalGeocoder(async () => { throw new Error('Unexpected'); }).searchAddresses('Vigo'))
        .rejects.toThrow('Unexpected');
    } finally {
      vi.useRealTimers();
    }
  });
});
