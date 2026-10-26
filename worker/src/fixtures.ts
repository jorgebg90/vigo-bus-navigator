import type { Fetcher } from './upstream';

interface FixtureRow {
  lineCode: string;
  destination: string;
  minutes: string;
}

const PAGINATED_ROWS: FixtureRow[] = [
  { lineCode: '12B', destination: 'HOSPITAL MEIXOEIRO', minutes: '1' },
  { lineCode: '11', destination: 'CABRAL por STA MARINA', minutes: '8' },
  { lineCode: '4A', destination: 'ARAG&#211;N por URZ&#193;IZ', minutes: '11' },
  { lineCode: '17', destination: 'R&#205;OS - A GU&#205;A', minutes: '26' },
  { lineCode: '4C', destination: 'GREGORIO ESPINO por URZ&#193;IZ', minutes: '31' },
  { lineCode: '27', destination: 'RABADEIRA', minutes: '41' },
  { lineCode: '11', destination: 'CABRAL por VIA TRANVIA', minutes: '43' },
  { lineCode: '4A', destination: 'ARAG&#211;N por URZ&#193;IZ', minutes: '46' },
  { lineCode: '17', destination: 'S. BADIA - A GU&#205;A', minutes: '56' },
  { lineCode: '12B', destination: 'HOSPITAL MEIXOEIRO', minutes: '59' },
  { lineCode: '4C', destination: 'GREGORIO ESPINO por URZ&#193;IZ', minutes: '65' },
  { lineCode: '27', destination: 'RABADEIRA', minutes: '109' }
];

function renderVitrasaPage(
  stopId: string,
  pageNumber: number,
  rows: FixtureRow[],
  pageCount: number,
  fault?: string
): string {
  const routeRows = rows.map((row) => `<tr><td class="col-linea">${row.lineCode}</td><td>${row.destination}</td><td class="col-minutos">${row.minutes}</td></tr>`).join('');
  const pager = Array.from({ length: pageCount }, (_, index) => {
    const page = index + 1;
    return page === pageNumber
      ? `<td><span>${page}</span></td>`
      : `<td><a href="javascript:__doPostBack('GridView1','Page$${page}')">${page}</a></td>`;
  }).join('');
  const tableId = fault === 'malformed' ? 'UnexpectedTable' : 'GridView1';
  return `<span id="lblParada">${stopId}</span>
    <form id="form1" action="https://untrusted.example/collect">
      <input type="hidden" name="__VIEWSTATE" value="view-${pageNumber}">
      <input type="hidden" name="__EVENTVALIDATION" value="event-${pageNumber}">
      <input type="hidden" name="__VIEWSTATEGENERATOR" value="generator-${pageNumber}">
    </form>
    <table id="${tableId}"><tr><th>L.</th><th>Ruta</th><th>Min.</th></tr>${routeRows}
      <tr align="center"><td colspan="3"><table><tr>${pager}</tr></table></td></tr>
    </table>`;
}

/** Deterministic sanitized Vitrasa HTML/WebForms response for local Worker tests. */
export function fixtureVitrasaResponse(stopId: string, pageNumber: number, fault?: string): Response {
  switch (fault) {
    case 'timeout': return new Response(null, { status: 504 });
    case 'error': return new Response('source unavailable', { status: 503 });
    case '429': return new Response(null, { status: 429 });
    case 'redirect': return Response.redirect('https://untrusted.example/redirect', 302);
    case 'later-page':
      if (pageNumber > 1) return new Response('later page unavailable', { status: 503 });
      break;
    case 'oversize':
      return new Response(renderVitrasaPage(stopId, pageNumber, [], 1).padEnd(128 * 1024 + 1, ' '));
  }

  if (stopId === '999999') return new Response('<span id="lblParada">Parada Inexistente</span>');
  if (stopId === '2000') return new Response(renderVitrasaPage(stopId, pageNumber, [], 1));

  if (fault === 'too-many-pages') {
    return new Response(renderVitrasaPage(stopId, pageNumber, [], 11));
  }
  if (fault === 'too-many-rows') {
    const rows = Array.from({ length: 101 }, (_, index) => ({
      lineCode: String(index + 1),
      destination: `DESTINATION ${index + 1}`,
      minutes: '1'
    }));
    return new Response(renderVitrasaPage(stopId, pageNumber, rows, 1));
  }
  if (fault === 'overlong-fields') {
    return new Response(renderVitrasaPage(stopId, pageNumber, [
      { lineCode: 'L'.repeat(33), destination: 'D'.repeat(257), minutes: '1' }
    ], 1));
  }

  const pages = stopId === '2790' ? [PAGINATED_ROWS.slice(0, 5), PAGINATED_ROWS.slice(5, 10), PAGINATED_ROWS.slice(10)] : [[
    { lineCode: '4A', destination: 'PRAZA DE AMERICA', minutes: '4' },
    { lineCode: '7', destination: 'COIA', minutes: '12' }
  ]];
  const selectedRows = pages[pageNumber - 1];
  if (!selectedRows) return new Response('invalid fixture page', { status: 503 });
  return new Response(renderVitrasaPage(stopId, pageNumber, selectedRows, pages.length, fault), {
    headers: { 'set-cookie': `ASP.NET_SessionId=fixture-${pageNumber}; Path=/; HttpOnly` }
  });
}

/** A fetch seam that can only serve local fixtures and never reaches the network. */
export function fixtureVitrasaFetcher(stopId: string, fault?: string): Fetcher {
  return async (input, init = {}) => {
    const requestUrl = new URL(String(input));
    if (requestUrl.origin !== 'https://infobus.vitrasa.es:8002' || requestUrl.pathname !== '/Default.aspx'
      || requestUrl.searchParams.get('parada') !== stopId) {
      throw new Error('Fixture fetcher rejected a non-source request');
    }
    const pageNumber = init.method === 'POST'
      ? Number(new URLSearchParams(String(init.body)).get('__EVENTARGUMENT')?.replace('Page$', ''))
      : 1;
    return fixtureVitrasaResponse(stopId, pageNumber, fault);
  };
}
