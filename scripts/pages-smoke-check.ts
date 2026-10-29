import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

type PagesResponse = Pick<Response, 'ok' | 'status'>;
type PagesFetcher = (url: string) => Promise<PagesResponse>;
type Wait = (milliseconds: number) => Promise<void>;

export interface VerifyPagesRoutesOptions {
  fetcher?: PagesFetcher;
  attempts?: number;
  retryDelayMs?: number;
  wait?: Wait;
}

const publicRoutes = [
  { label: 'homepage', path: './' },
  { label: 'OpenAPI documentation', path: 'docs/openapi/' }
] as const;

export async function verifyPagesRoutes(
  siteUrl: string,
  options: VerifyPagesRoutesOptions = {}
): Promise<void> {
  const baseUrl = new URL(siteUrl);
  if (baseUrl.protocol !== 'https:') {
    throw new Error('Pages site URL must use HTTPS');
  }
  if (!Number.isInteger(options.attempts ?? 6) || (options.attempts ?? 6) < 1) {
    throw new Error('Pages route check attempts must be a positive integer');
  }
  if (!Number.isFinite(options.retryDelayMs ?? 10_000) || (options.retryDelayMs ?? 10_000) < 0) {
    throw new Error('Pages route retry delay must be a non-negative number');
  }

  if (!baseUrl.pathname.endsWith('/')) baseUrl.pathname += '/';

  const fetcher = options.fetcher ?? ((url: string) => fetch(url));
  const attempts = options.attempts ?? 6;
  const retryDelayMs = options.retryDelayMs ?? 10_000;
  const wait = options.wait ?? ((milliseconds: number) =>
    new Promise<void>((resolveWait) => setTimeout(resolveWait, milliseconds)));
  const failures: string[] = [];

  for (const route of publicRoutes) {
    const url = new URL(route.path, baseUrl).toString();
    let lastFailure = 'No response received';
    let reachable = false;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const response = await fetcher(url);
        if (response.ok) {
          reachable = true;
          break;
        }
        lastFailure = `HTTP ${response.status}`;
      } catch (error) {
        lastFailure = error instanceof Error ? error.message : String(error);
      }

      if (attempt < attempts) await wait(retryDelayMs);
    }

    if (!reachable) failures.push(`- ${url}: ${lastFailure} after ${attempts} attempts`);
  }

  if (failures.length > 0) {
    throw new Error(`Pages availability verification failed:\n${failures.join('\n')}`);
  }
}

async function run(): Promise<void> {
  const siteUrl = process.env.PAGES_SITE_URL;
  if (!siteUrl) throw new Error('PAGES_SITE_URL is required for Pages availability verification');

  await verifyPagesRoutes(siteUrl);
  console.log(`Pages availability verification passed for ${siteUrl}`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
