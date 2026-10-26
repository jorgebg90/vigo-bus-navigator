export interface VitrasaSourceRow {
  lineCode: string;
  destination: string;
  minutesText: string;
}

export type VitrasaPageResult =
  | { kind: 'arrivals'; rows: VitrasaSourceRow[] }
  | { kind: 'empty'; rows: [] }
  | { kind: 'stop-not-exist'; rows: [] };

export interface VitrasaPostbackState {
  formCount: number;
  hiddenFields: Array<[string, string]>;
  pageNumbers: number[];
}

const GRID_ROWS = '#GridView1 tr';
const GRID_CELLS = '#GridView1 td, #GridView1 th';

interface Cell {
  tagName: string;
  className: string;
  text: string;
}

interface Row {
  cells: Cell[];
  currentCell?: Cell;
}

function cleanText(value: string): string {
  return decodeHtmlEntities(value).replace(/\s+/g, ' ').trim();
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  aacute: 'á', Aacute: 'Á',
  ccedil: 'ç', Ccedil: 'Ç',
  eacute: 'é', Eacute: 'É',
  gt: '>',
  iacute: 'í', Iacute: 'Í',
  lt: '<',
  nbsp: ' ',
  ntilde: 'ñ', Ntilde: 'Ñ',
  oacute: 'ó', Oacute: 'Ó',
  ordm: 'º', ordf: 'ª',
  quot: '"',
  uacute: 'ú', Uacute: 'Ú'
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(?:x([\da-f]{1,6})|(\d{1,7}));?/gi, (entity, hexadecimal: string, decimal: string) => {
      const codePoint = Number.parseInt(hexadecimal ?? decimal, hexadecimal ? 16 : 10);
      if (codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return entity;
      return String.fromCodePoint(codePoint);
    })
    .replace(/&([a-z]+);/gi, (entity, name: string) => NAMED_ENTITIES[name] ?? entity);
}

function classNames(value: string): Set<string> {
  return new Set(value.split(/\s+/).filter(Boolean));
}

/** Extracts and validates one Vitrasa WebForms page inside the Workers runtime. */
export async function extractVitrasaPage(html: string, requestedStopId: string): Promise<VitrasaPageResult> {
  let tableCount = 0;
  let labelCount = 0;
  let stopLabel = '';
  let insidePager = false;
  let currentRow: Row | undefined;
  const tableRows: Row[] = [];

  const finishCell = () => {
    if (!currentRow?.currentCell) return;
    currentRow.cells.push(currentRow.currentCell);
    currentRow.currentCell = undefined;
  };
  const finishRow = () => {
    finishCell();
    if (!currentRow) return;
    tableRows.push(currentRow);
    currentRow = undefined;
  };

  const parsed = await new HTMLRewriter()
    .on('#lblParada', {
      element() {
        labelCount += 1;
      },
      text(chunk) {
        stopLabel += chunk.text;
      }
    })
    .on('#GridView1', {
      element() {
        tableCount += 1;
      }
    })
    .on('#GridView1 table', {
      element() {
        insidePager = true;
        finishCell();
      }
    })
    .on(GRID_ROWS, {
      element() {
        if (insidePager) return;
        finishRow();
        currentRow = { cells: [] };
      }
    })
    .on(GRID_CELLS, {
      element(element) {
        if (insidePager || !currentRow) return;
        finishCell();
        currentRow.currentCell = {
          tagName: element.tagName,
          className: element.getAttribute('class') ?? '',
          text: ''
        };
      },
      text(chunk) {
        if (!insidePager && currentRow?.currentCell) currentRow.currentCell.text += chunk.text;
      }
    })
    .onDocument({
      end() {
        finishRow();
      }
    })
    .transform(new Response(html))
    .text();

  if (labelCount !== 1) throw new Error('Invalid Vitrasa stop identity markup');

  const identity = cleanText(stopLabel);
  if (identity.toLocaleLowerCase('en') === 'parada inexistente') {
    return { kind: 'stop-not-exist', rows: [] };
  }
  if (identity !== requestedStopId) throw new Error('Vitrasa stop identity mismatch');
  if (tableCount !== 1) throw new Error('Invalid Vitrasa page structure');

  const headerRow = tableRows.find((row) => row.cells.some((cell) => cell.tagName.toLowerCase() === 'th'));
  const headers = headerRow?.cells.map((cell) => cleanText(cell.text));
  if (!headers || headers.length !== 3 || headers.some((header, index) => header !== ['L.', 'Ruta', 'Min.'][index])) {
    throw new Error('Invalid Vitrasa table headers');
  }

  const rows: VitrasaSourceRow[] = [];
  for (const row of tableRows) {
    const lineCells = row.cells.filter((cell) => classNames(cell.className).has('col-linea'));
    const minuteCells = row.cells.filter((cell) => classNames(cell.className).has('col-minutos'));
    const hasRouteMarker = lineCells.length > 0 || minuteCells.length > 0;
    if (!hasRouteMarker) continue;
    if (lineCells.length !== 1 || minuteCells.length !== 1 || row.cells.length !== 3) {
      throw new Error('Malformed Vitrasa route row');
    }

    const lineIndex = row.cells.indexOf(lineCells[0]);
    const minuteIndex = row.cells.indexOf(minuteCells[0]);
    if (lineIndex !== 0 || minuteIndex !== 2) throw new Error('Malformed Vitrasa route cells');

    const lineCode = cleanText(lineCells[0].text);
    const destination = cleanText(row.cells[1].text);
    const minutesText = cleanText(minuteCells[0].text);
    if (!lineCode || !destination || !minutesText) throw new Error('Empty Vitrasa route value');
    rows.push({ lineCode, destination, minutesText });
  }

  return rows.length ? { kind: 'arrivals', rows } : { kind: 'empty', rows: [] };
}

/** Extracts only form1 hidden fields and GridView1 pager destinations from a page. */
export async function extractVitrasaPostbackState(html: string): Promise<VitrasaPostbackState> {
  let formCount = 0;
  const hiddenFields: Array<[string, string]> = [];
  const pageNumbers: number[] = [];
  let activePageIndex = -1;
  let invalidPostback = false;

  const parsed = await new HTMLRewriter()
    .on('form#form1', {
      element() {
        formCount += 1;
      }
    })
    .on('form#form1 input[type="hidden"]', {
      element(element) {
        const name = element.getAttribute('name');
        if (!name) {
          invalidPostback = true;
          return;
        }
        hiddenFields.push([name, element.getAttribute('value') ?? '']);
      }
    })
    .on('#GridView1 a', {
      element(element) {
        const href = element.getAttribute('href') ?? '';
        if (!href.includes('__doPostBack')) return;
        const match = href.match(/^javascript:__doPostBack\('GridView1','Page\$(\d+)'\)$/);
        if (!match) {
          invalidPostback = true;
          return;
        }
        pageNumbers.push(Number(match[1]));
      }
    })
    .on('#GridView1 table span', {
      element() {
        activePageIndex = pageNumbers.length;
        pageNumbers.push(Number.NaN);
      },
      text(chunk) {
        if (activePageIndex < 0) return;
        const pageNumber = Number(cleanText(chunk.text));
        if (Number.isInteger(pageNumber) && pageNumber > 0) pageNumbers[activePageIndex] = pageNumber;
      }
    })
    .transform(new Response(html))
    .text();
  void parsed;

  if (invalidPostback) throw new Error('Malformed Vitrasa postback state');
  const uniqueFields = new Set<string>();
  for (const [name] of hiddenFields) {
    if (uniqueFields.has(name)) throw new Error('Duplicate Vitrasa hidden field');
    uniqueFields.add(name);
  }
  if (pageNumbers.some((page) => !Number.isInteger(page) || page < 1)) {
    throw new Error('Malformed Vitrasa page number');
  }

  return { formCount, hiddenFields, pageNumbers };
}
