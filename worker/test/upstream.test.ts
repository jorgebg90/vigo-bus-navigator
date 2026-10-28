import { describe, expect, it, vi } from 'vitest';
import { fetchVitrasaArrivals } from '../src/upstream';
import { fixtureVitrasaFetcher } from '../src/fixtures';

interface RecordedRequest {
  url: string;
  init: RequestInit;
}

interface FixtureRow {
  lineCode: string;
  destination: string;
  minutes: string;
}

const expectedRows: FixtureRow[] = [
  { lineCode: '12B', destination: 'HOSPITAL MEIXOEIRO', minutes: '1' },
  { lineCode: '11', destination: 'CABRAL por STA MARINA', minutes: '8' },
  { lineCode: '4A', destination: 'ARAGÓN por URZÁIZ', minutes: '11' },
  { lineCode: '17', destination: 'RÍOS - A GUÍA', minutes: '26' },
  { lineCode: '4C', destination: 'GREGORIO ESPINO por URZÁIZ', minutes: '31' },
  { lineCode: '27', destination: 'RABADEIRA', minutes: '41' },
  { lineCode: '11', destination: 'CABRAL por VIA TRANVIA', minutes: '43' },
  { lineCode: '4A', destination: 'ARAGÓN por URZÁIZ', minutes: '46' },
  { lineCode: '17', destination: 'S. BADIA - A GUÍA', minutes: '56' },
  { lineCode: '12B', destination: 'HOSPITAL MEIXOEIRO', minutes: '59' },
  { lineCode: '4C', destination: 'GREGORIO ESPINO por URZÁIZ', minutes: '65' },
  { lineCode: '27', destination: 'RABADEIRA', minutes: '109' }
];

function renderPage(pageNumber: number, rows: FixtureRow[], stopId = '2790', pageNumbers = [1, 2, 3]): string {
  const states = `
    <input type="hidden" name="__VIEWSTATE" value="view-${pageNumber}">
    <input type="hidden" name="__EVENTVALIDATION" value="event-${pageNumber}">
    <input type="hidden" name="__VIEWSTATEGENERATOR" value="generator-${pageNumber}">`;
  const pager = pageNumbers.map((number) => number === pageNumber
    ? `<td><span>${number}</span></td>`
    : `<td><a href="javascript:__doPostBack('GridView1','Page$${number}')">${number}</a></td>`).join('');
  const pagerRow = pageNumbers.length
    ? `<tr align="center"><td colspan="3"><table><tr>${pager}</tr></table></td></tr>`
    : '';
  const routeRows = rows.map((row) => `<tr><td class="col-linea">${row.lineCode}</td><td>${row.destination}</td><td class="col-minutos">${row.minutes}</td></tr>`).join('\n');

  return `<span id="lblParada">${stopId}</span>
    <form id="form1" action="https://untrusted.example/collect">${states}</form>
    <table id="GridView1"><tr><th>L.</th><th>Ruta</th><th>Min.</th></tr>
      ${routeRows}
      ${pagerRow}
    </table>`;
}

function responseFor(pageNumber: number): Response {
  const pageRows = [expectedRows.slice(0, 5), expectedRows.slice(5, 10), expectedRows.slice(10)][pageNumber - 1];
  return new Response(renderPage(pageNumber, pageRows), {
    status: 200,
    headers: { 'set-cookie': `ASP.NET_SessionId=session-${pageNumber}; Path=/; HttpOnly` }
  });
}

describe('Vitrasa WebForms upstream protocol', () => {
  it('replays the deterministic 5/5/2 stop 2790 fixture without network access', async () => {
    const rows = await fetchVitrasaArrivals('2790', fixtureVitrasaFetcher('2790'));

    expect(rows).toEqual(expectedRows.map((row) => ({
      lineCode: row.lineCode,
      destination: row.destination,
      minutesText: row.minutes
    })));
  });

  it('provides deterministic empty, missing-stop, and later-page failure fixtures', async () => {
    await expect(fetchVitrasaArrivals('2000', fixtureVitrasaFetcher('2000'))).resolves.toEqual([]);
    await expect(fetchVitrasaArrivals('999999', fixtureVitrasaFetcher('999999'))).rejects.toThrow('STOP_NOT_EXIST');
    await expect(fetchVitrasaArrivals('2790', fixtureVitrasaFetcher('2790', 'later-page'))).rejects.toThrow();
  });

  it('provides deterministic malformed, redirect, page, row, and body-limit fixtures', async () => {
    for (const fault of ['malformed', 'redirect', 'too-many-pages', 'too-many-rows', 'oversize', 'overlong-fields']) {
      await expect(fetchVitrasaArrivals('2790', fixtureVitrasaFetcher('2790', fault))).rejects.toThrow();
    }
  });

  it('gets the first page then posts refreshed state and cookies sequentially through all pages', async () => {
    const requests: RecordedRequest[] = [];
    let responseNumber = 0;
    const fetcher = async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
      requests.push({ url: String(input), init });
      responseNumber += 1;
      return responseFor(responseNumber);
    };

    const rows = await fetchVitrasaArrivals('2790', fetcher);

    expect(rows.map(({ lineCode, destination, minutesText }) => ({
      lineCode,
      destination,
      minutes: minutesText
    }))).toEqual(expectedRows);
    expect(requests).toHaveLength(3);
    expect(requests.map(({ init }) => init.method)).toEqual(['GET', 'POST', 'POST']);
    expect(requests.map(({ url }) => url)).toEqual(Array(3).fill(
      'https://infobus.vitrasa.es:8002/Default.aspx?parada=2790'
    ));

    const pageTwo = requests[1].init;
    const pageTwoBody = new URLSearchParams(String(pageTwo.body));
    expect(new Headers(pageTwo.headers).get('content-type'))
      .toBe('application/x-www-form-urlencoded; charset=UTF-8');
    expect(pageTwoBody.get('__VIEWSTATE')).toBe('view-1');
    expect(pageTwoBody.get('__EVENTVALIDATION')).toBe('event-1');
    expect(pageTwoBody.get('__VIEWSTATEGENERATOR')).toBe('generator-1');
    expect(pageTwoBody.get('__EVENTTARGET')).toBe('GridView1');
    expect(pageTwoBody.get('__EVENTARGUMENT')).toBe('Page$2');
    expect([...pageTwoBody.keys()].sort()).toEqual([
      '__EVENTARGUMENT', '__EVENTTARGET', '__EVENTVALIDATION', '__VIEWSTATE', '__VIEWSTATEGENERATOR'
    ]);
    expect(new Headers(pageTwo.headers).get('cookie')).toBe('ASP.NET_SessionId=session-1');

    const pageThree = requests[2].init;
    const pageThreeBody = new URLSearchParams(String(pageThree.body));
    expect(pageThreeBody.get('__VIEWSTATE')).toBe('view-2');
    expect(pageThreeBody.get('__EVENTVALIDATION')).toBe('event-2');
    expect(pageThreeBody.get('__VIEWSTATEGENERATOR')).toBe('generator-2');
    expect(pageThreeBody.get('__EVENTTARGET')).toBe('GridView1');
    expect(pageThreeBody.get('__EVENTARGUMENT')).toBe('Page$3');
    expect([...pageThreeBody.keys()].sort()).toEqual([
      '__EVENTARGUMENT', '__EVENTTARGET', '__EVENTVALIDATION', '__VIEWSTATE', '__VIEWSTATEGENERATOR'
    ]);
    expect(new Headers(pageThree.headers).get('cookie')).toBe('ASP.NET_SessionId=session-2');

    for (const { init } of requests) {
      const headers = new Headers(init.headers);
      expect(headers.has('authorization')).toBe(false);
      expect(headers.has('x-forwarded-for')).toBe(false);
    }
  });

  it('accepts a single-page source response with no pager controls', async () => {
    const requests: RecordedRequest[] = [];
    const fetcher = async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
      requests.push({ url: String(input), init });
      return new Response(renderPage(1, expectedRows.slice(0, 2), '90', []));
    };

    const rows = await fetchVitrasaArrivals('90', fetcher);

    expect(rows).toEqual(expectedRows.slice(0, 2).map((row) => ({
      lineCode: row.lineCode,
      destination: row.destination,
      minutesText: row.minutes
    })));
    expect(requests).toHaveLength(1);
    expect(requests[0].init.method).toBe('GET');
  });

  it('forwards a valid numeric stop ID even when it is not in the static catalog', async () => {
    const requests: string[] = [];
    const fetcher = async (input: string | URL | Request): Promise<Response> => {
      requests.push(String(input));
      return new Response(renderPage(1, expectedRows.slice(0, 1), '123456', [1]));
    };

    await fetchVitrasaArrivals('123456', fetcher);

    expect(requests).toEqual(['https://infobus.vitrasa.es:8002/Default.aspx?parada=123456']);
  });

  it('fails closed on HTTP errors and unrelated HTML error pages', async () => {
    await expect(fetchVitrasaArrivals('2790', async () => new Response('error', { status: 503 })))
      .rejects.toThrow();
    await expect(fetchVitrasaArrivals('2790', async () => new Response('<html>Service unavailable</html>')))
      .rejects.toThrow();
  });
  it('rejects a response that identifies a different stop', async () => {
    await expect(fetchVitrasaArrivals('2791', async () => new Response(
      renderPage(1, expectedRows.slice(0, 1), '2790', [1])
    ))).rejects.toThrow();
  });

  it('rejects missing, duplicate, or skipped pagination controls', async () => {
    for (const pageNumbers of [[1, 3], [1, 2, 2]]) {
      await expect(fetchVitrasaArrivals('2790', async () => new Response(
        renderPage(1, expectedRows.slice(0, 1), '2790', pageNumbers)
      ))).rejects.toThrow();
    }
  });

  it('accepts ten pages and rejects discovery of an eleventh before requesting it', async () => {
    const validPageNumbers = Array.from({ length: 10 }, (_, index) => index + 1);
    let validCalls = 0;
    await fetchVitrasaArrivals('2790', async () => {
      validCalls += 1;
      return new Response(renderPage(validCalls, [], '2790', validPageNumbers));
    });
    expect(validCalls).toBe(10);

    const tooManyPageNumbers = Array.from({ length: 11 }, (_, index) => index + 1);
    let rejectedCalls = 0;
    await expect(fetchVitrasaArrivals('2790', async () => {
      rejectedCalls += 1;
      return new Response(renderPage(1, [], '2790', tooManyPageNumbers));
    })).rejects.toThrow();
    expect(rejectedCalls).toBe(1);
  });

  it('rejects a page over 128 KiB and a lookup over 1 MiB', async () => {
    const oversizedPage = renderPage(1, [], '2790', [1]).padEnd(128 * 1024 + 1, ' ');
    await expect(fetchVitrasaArrivals('2790', async () => new Response(oversizedPage)))
      .rejects.toThrow();

    const pageNumbers = Array.from({ length: 10 }, (_, index) => index + 1);
    let pageNumber = 0;
    await expect(fetchVitrasaArrivals('2790', async () => {
      pageNumber += 1;
      const html = renderPage(pageNumber, [], '2790', pageNumbers).padEnd(110_000, ' ');
      return new Response(html);
    })).rejects.toThrow();
  });

  it('rejects more than 100 rows and line/destination fields over their limits', async () => {
    const tooManyRows = Array.from({ length: 101 }, (_, index) => ({
      lineCode: String(index + 1),
      destination: `DESTINATION ${index + 1}`,
      minutes: '1'
    }));
    await expect(fetchVitrasaArrivals('2790', async () => new Response(
      renderPage(1, tooManyRows, '2790', [1])
    ))).rejects.toThrow();

    await expect(fetchVitrasaArrivals('2790', async () => new Response(renderPage(1, [
      { lineCode: 'L'.repeat(33), destination: 'DESTINATION', minutes: '1' }
    ], '2790', [1])))).rejects.toThrow();
    await expect(fetchVitrasaArrivals('2790', async () => new Response(renderPage(1, [
      { lineCode: '4A', destination: 'D'.repeat(257), minutes: '1' }
    ], '2790', [1])))).rejects.toThrow();
  });

  it('applies one aggregate eight-second deadline across sequential pages', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const fetcher = async (_input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
      calls += 1;
      const responseNumber = calls;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve(responseFor(responseNumber)), 4_500);
        init.signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });
    };

    try {
      const result = fetchVitrasaArrivals('2790', fetcher);
      await vi.advanceTimersByTimeAsync(8_001);
      await expect(result).rejects.toThrow();
      expect(calls).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});