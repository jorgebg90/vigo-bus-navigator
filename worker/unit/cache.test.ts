import { describe, expect, it } from 'vitest';
import { EdgeCache } from '../src/cache';

function createRetainingCache(): Cache {
  const entries = new Map<string, Response>();
  return {
    match: async (request: Request) => entries.get(request.url)?.clone(),
    put: async (request: Request, response: Response) => { entries.set(request.url, response.clone()); }
  } as unknown as Cache;
}

const result = {
  storedAt: '2026-10-26T10:00:00.000Z',
  response: { stopId: '1234', generatedAt: '2026-10-26T10:00:00.000Z', dataStatus: 'current' as const, arrivals: [] }
};

describe('EdgeCache application-level age bounds', () => {
  it('enforces a strict 30-second fresh boundary even when the backing cache retains an entry', async () => {
    const cache = new EdgeCache(createRetainingCache());
    await cache.putFresh('1234', result);

    expect(await cache.getFresh('1234', new Date('2026-10-26T10:00:29.999Z'))).toEqual(result);
    expect(await cache.getFresh('1234', new Date('2026-10-26T10:00:30.000Z'))).toBeUndefined();
  });

  it('enforces a strict 300-second stale boundary even when the backing cache retains an entry', async () => {
    const cache = new EdgeCache(createRetainingCache());
    await cache.putLastKnown('1234', result);

    expect(await cache.getLastKnown('1234', new Date('2026-10-26T10:04:59.999Z'))).toEqual(result);
    expect(await cache.getLastKnown('1234', new Date('2026-10-26T10:05:00.000Z'))).toBeUndefined();
  });
});