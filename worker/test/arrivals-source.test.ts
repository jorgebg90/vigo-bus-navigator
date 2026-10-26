import { describe, expect, it } from 'vitest';
import { extractVitrasaPage } from '../src/source-html';

function renderPage({
  stopId = '2790',
  rows = '<tr><td class="col-linea">4A</td><td>ARAGÓN &amp; URZ&#193;IZ</td><td class="col-minutos">11</td></tr>',
  tableId = 'GridView1',
  headers = '<th scope="col">L.</th><th scope="col">Ruta</th><th scope="col">Min.</th>',
  label = `<span id="lblParada">${stopId}</span>`
}: {
  stopId?: string;
  rows?: string;
  tableId?: string;
  headers?: string;
  label?: string;
} = {}): string {
  return `${label}<form id="form1"><input type="hidden" name="__VIEWSTATE" value="state"></form>
    <table id="${tableId}"><tr>${headers}</tr>${rows}
      <tr align="center"><td colspan="3"><table><tr><td><a href="javascript:__doPostBack('GridView1','Page$2')">2</a></td></tr></table></td></tr>
    </table>`;
}

describe('Vitrasa arrivals HTML extraction', () => {
  it('verifies the requested stop identity and extracts decoded route cells', async () => {
    await expect(extractVitrasaPage(renderPage(), '2790')).resolves.toEqual({
      kind: 'arrivals',
      rows: [{ lineCode: '4A', destination: 'ARAGÓN & URZÁIZ', minutesText: '11' }]
    });
  });

  it('rejects an exact stop identity mismatch', async () => {
    await expect(extractVitrasaPage(renderPage(), '2791')).rejects.toThrow();
  });

  it('requires exactly one GridView1 table and the expected headers', async () => {
    await expect(extractVitrasaPage(renderPage({ tableId: 'OtherTable' }), '2790')).rejects.toThrow();
    await expect(extractVitrasaPage(renderPage({ headers: '<th>L.</th><th>Ruta</th><th>Wait</th>' }), '2790')).rejects.toThrow();
    const duplicateTable = `${renderPage()}${renderPage()}`;
    await expect(extractVitrasaPage(duplicateTable, '2790')).rejects.toThrow();
  });

  it('ignores nested pager rows and accepts a recognized table with no route rows', async () => {
    await expect(extractVitrasaPage(renderPage({ rows: '' }), '2790')).resolves.toEqual({
      kind: 'empty',
      rows: []
    });
  });

  it.each([
    ['missing line', '<tr><td class="col-linea"></td><td>DESTINATION</td><td class="col-minutos">1</td></tr>'],
    ['missing destination', '<tr><td class="col-linea">4A</td><td></td><td class="col-minutos">1</td></tr>'],
    ['missing minutes cell', '<tr><td class="col-linea">4A</td><td>DESTINATION</td><td>1</td></tr>']
  ])('fails closed for a present route row with %s', async (_name, rows) => {
    await expect(extractVitrasaPage(renderPage({ rows }), '2790')).rejects.toThrow();
  });

  it('recognizes the explicit nonexistent-stop response', async () => {
    await expect(extractVitrasaPage('<span id="lblParada">Parada Inexistente</span>', '999999'))
      .resolves.toEqual({ kind: 'stop-not-exist', rows: [] });
  });

  it.each([
    ['missing stop label', renderPage({ label: '' })],
    ['duplicate stop label', `${renderPage()}<span id="lblParada">2790</span>`],
    ['missing table', '<span id="lblParada">2790</span>'],
    ['malformed table headers', renderPage({ headers: '<th>L.</th><td>Ruta</td>' })]
  ])('rejects %s markup', async (_name, html) => {
    await expect(extractVitrasaPage(html, '2790')).rejects.toThrow();
  });
});