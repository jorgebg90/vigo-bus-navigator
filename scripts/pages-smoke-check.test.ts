import { describe, expect, it, vi } from 'vitest';
import { verifyPagesRoutes } from './pages-smoke-check';

describe('verifyPagesRoutes', () => {
  it('checks the homepage and OpenAPI page under the project-site base path', async () => {
    const fetcher = vi.fn(async (_url: string) => ({ ok: true, status: 200 }));

    await verifyPagesRoutes('https://example.github.io/vigo-bus-navigator/', {
      fetcher
    });

    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      'https://example.github.io/vigo-bus-navigator/',
      'https://example.github.io/vigo-bus-navigator/docs/openapi/'
    ]);
  });

  it('retries transient HTTP failures within the configured attempt limit', async () => {
    const fetcher = vi.fn()
      .mockImplementationOnce(async (_url: string) => ({ ok: false, status: 503 }))
      .mockImplementation(async (_url: string) => ({ ok: true, status: 200 }));
    const wait = vi.fn(async () => {});

    await verifyPagesRoutes('https://example.github.io/vigo-bus-navigator/', {
      fetcher,
      attempts: 2,
      retryDelayMs: 1,
      wait
    });

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(1);
  });

  it('reports the failing public route after the bounded retries', async () => {
    const fetcher = vi.fn()
      .mockImplementationOnce(async (_url: string) => ({ ok: true, status: 200 }))
      .mockImplementation(async (_url: string) => ({ ok: false, status: 404 }));

    await expect(verifyPagesRoutes('https://example.github.io/vigo-bus-navigator/', {
      fetcher,
      attempts: 2,
      retryDelayMs: 0,
      wait: async () => {}
    })).rejects.toThrow(
      'Pages availability verification failed:\n'
      + '- https://example.github.io/vigo-bus-navigator/docs/openapi/: HTTP 404'
    );
  });

  it('retries network errors and rejects non-HTTPS site URLs', async () => {
    const fetcher = vi.fn()
      .mockImplementationOnce(async (_url: string) => {
        throw new Error('connection reset');
      })
      .mockImplementation(async (_url: string) => ({ ok: true, status: 200 }));

    await verifyPagesRoutes('https://example.github.io/vigo-bus-navigator/', {
      fetcher,
      attempts: 2,
      retryDelayMs: 0,
      wait: async () => {}
    });
    await expect(verifyPagesRoutes('http://example.github.io/', { fetcher }))
      .rejects.toThrow('Pages site URL must use HTTPS');
  });
});
