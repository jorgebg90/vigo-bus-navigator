import { extractVitrasaPage, extractVitrasaPostbackState, type VitrasaSourceRow } from './source-html';
import { StopNotExistError } from './normalize';

export const UPSTREAM_TIMEOUT_MS = 8_000;
export const MAX_SOURCE_PAGE_BYTES = 128 * 1024;
export const MAX_SOURCE_LOOKUP_BYTES = 1024 * 1024;
export const MAX_SOURCE_PAGES = 10;
export const MAX_SOURCE_ROWS = 100;
export const VITRASA_URL = 'https://infobus.vitrasa.es:8002/Default.aspx';

export class UpstreamTimeoutError extends Error {
  constructor() {
    super('UPSTREAM_TIMEOUT');
    this.name = 'UpstreamTimeoutError';
  }
}

export class UpstreamRateLimitError extends Error {
  constructor() {
    super('RATE_LIMITED');
    this.name = 'UpstreamRateLimitError';
  }
}

export class UpstreamError extends Error {
  constructor() {
    super('UPSTREAM_ERROR');
    this.name = 'UpstreamError';
  }
}

export class UpstreamNetworkError extends Error {
  constructor() {
    super('UPSTREAM_NETWORK_ERROR');
    this.name = 'UpstreamNetworkError';
  }
}

export type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

async function defaultFetcher(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  return fetch(input, init);
}

interface PageBody {
  html: string;
  bytesRead: number;
}

async function readBoundedBody(response: Response, remainingBytes: number): Promise<PageBody> {
  const declaredLength = Number(response.headers.get('content-length'));
  const pageLimit = Math.min(MAX_SOURCE_PAGE_BYTES, remainingBytes);
  if (Number.isFinite(declaredLength) && declaredLength > pageLimit) throw new UpstreamError();
  if (!response.body) throw new UpstreamError();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      bytesRead += result.value.byteLength;
      if (bytesRead > pageLimit) {
        await reader.cancel();
        throw new UpstreamError();
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { html: new TextDecoder('utf-8', { fatal: true }).decode(body), bytesRead };
  } catch {
    throw new UpstreamError();
  }
}

function mergeCookies(cookies: Map<string, string>, response: Response): void {
  const header = response.headers.get('set-cookie');
  if (!header) return;
  for (const cookie of header.split(/,(?=[^;,=]+=[^;,]*)/)) {
    const pair = cookie.split(';', 1)[0].trim();
    const separator = pair.indexOf('=');
    if (separator <= 0) continue;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (value) cookies.set(name, value);
    else cookies.delete(name);
  }
}

function validatePageNumbers(pageNumbers: number[], currentPage: number): number[] {
  if (!pageNumbers.length) {
    if (currentPage === 1) return [1];
    throw new UpstreamError();
  }
  if (pageNumbers.includes(currentPage) === false) throw new UpstreamError();
  const unique = [...new Set(pageNumbers)].sort((left, right) => left - right);
  if (unique.length !== pageNumbers.length || unique[0] !== 1 || unique.length > MAX_SOURCE_PAGES) {
    throw new UpstreamError();
  }
  if (unique.some((page, index) => page !== index + 1)) throw new UpstreamError();
  return unique;
}

/** Fetch every sequential WebForms page for one validated public stop ID. */
export async function fetchVitrasaArrivals(
  stopId: string,
  fetcher: Fetcher = defaultFetcher
): Promise<VitrasaSourceRow[]> {
  if (!/^\d{1,6}$/.test(stopId)) throw new UpstreamError();

  const controller = new AbortController();
  let timedOut = false;
  let timeoutHandle: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new UpstreamTimeoutError());
    }, UPSTREAM_TIMEOUT_MS);
  });

  const lookup = async (): Promise<VitrasaSourceRow[]> => {
    const sourceUrl = new URL(VITRASA_URL);
    sourceUrl.searchParams.set('parada', stopId);
    const cookies = new Map<string, string>();
    const rows: VitrasaSourceRow[] = [];
    let totalBytes = 0;
    let currentPage = 1;
    let postbackFields: Array<[string, string]> = [];

    while (true) {
      const headers = new Headers({ accept: 'text/html,application/xhtml+xml' });
      const init: RequestInit = {
        method: currentPage === 1 ? 'GET' : 'POST',
        redirect: 'manual',
        signal: controller.signal,
        headers
      };
      if (currentPage > 1) {
        const body = new URLSearchParams(postbackFields);
        body.set('__EVENTTARGET', 'GridView1');
        body.set('__EVENTARGUMENT', `Page$${currentPage}`);
        headers.set('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
        const cookie = [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');
        if (cookie) headers.set('cookie', cookie);
        init.body = body.toString();
      }

      let response: Response;
      try {
        response = await fetcher(sourceUrl, init);
      } catch (failure) {
        if (timedOut || (failure instanceof Error && failure.name === 'AbortError')) {
          throw new UpstreamTimeoutError();
        }
        throw new UpstreamNetworkError();
      }
      if (response.status === 429) throw new UpstreamRateLimitError();
      if (response.status === 504) throw new UpstreamTimeoutError();
      if (response.status >= 300 && response.status < 400) throw new UpstreamError();
      if (!response.ok) throw new UpstreamError();

      mergeCookies(cookies, response);
      const page = await readBoundedBody(response, MAX_SOURCE_LOOKUP_BYTES - totalBytes);
      totalBytes += page.bytesRead;
      let extracted: Awaited<ReturnType<typeof extractVitrasaPage>>;
      let postbackState: Awaited<ReturnType<typeof extractVitrasaPostbackState>>;
      try {
        [extracted, postbackState] = await Promise.all([
          extractVitrasaPage(page.html, stopId),
          extractVitrasaPostbackState(page.html)
        ]);
      } catch {
        throw new UpstreamError();
      }

      if (extracted.kind === 'stop-not-exist') {
        if (currentPage === 1) throw new StopNotExistError();
        throw new UpstreamError();
      }
      if (extracted.rows.some((row) => row.lineCode.length > 32 || row.destination.length > 256)) {
        throw new UpstreamError();
      }
      rows.push(...extracted.rows);
      if (rows.length > MAX_SOURCE_ROWS) throw new UpstreamError();

      const pages = validatePageNumbers(postbackState.pageNumbers, currentPage);
      const nextPage = pages.find((pageNumber) => pageNumber > currentPage);
      if (!nextPage) return rows;
      if (nextPage !== currentPage + 1 || currentPage >= MAX_SOURCE_PAGES) throw new UpstreamError();
      if (postbackState.formCount !== 1) throw new UpstreamError();

      const fields = new Map(postbackState.hiddenFields);
      if (!fields.has('__VIEWSTATE') || !fields.has('__EVENTVALIDATION')) throw new UpstreamError();
      postbackFields = [...fields];
      currentPage = nextPage;
    }
  };

  try {
    return await Promise.race([lookup(), timeout]);
  } catch (failure) {
    if (timedOut) throw new UpstreamTimeoutError();
    if (failure instanceof UpstreamError || failure instanceof UpstreamRateLimitError
      || failure instanceof UpstreamTimeoutError || failure instanceof UpstreamNetworkError
      || failure instanceof StopNotExistError) throw failure;
    throw new UpstreamError();
  } finally {
    clearTimeout(timeoutHandle!);
  }
}
