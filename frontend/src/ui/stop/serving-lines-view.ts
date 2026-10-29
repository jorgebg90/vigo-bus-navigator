import type { MunicipalOperationResult, MunicipalServingLinesReceipt } from '../../application/ports';
import type { LineStopDetail } from '../../domain/types';
import { translateCurrent } from '../../i18n';
import { createLineBadge } from '../line-badge';

export function renderServingLines(
  root: HTMLElement,
  result: MunicipalOperationResult<MunicipalServingLinesReceipt>,
  onSelectLine: (lineCode: string) => void,
  lineStopDetails: readonly LineStopDetail[] = []
): void {
  root.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = translateCurrent('servingLinesTitle');
  root.append(heading);

  if (result.kind === 'unavailable') {
    const status = document.createElement('p');
    status.dataset.servingLinesStatus = result.reason;
    status.setAttribute('role', 'status');
    status.textContent = translateCurrent('servingLinesUnavailable');
    root.append(status);
    return;
  }

  const list = document.createElement('ul');
  list.dataset.servingLinesList = 'true';
  list.setAttribute('aria-label', translateCurrent('servingLinesTitle'));
  for (const line of result.value.lines) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'line-list-item';
    button.dataset.servingLine = line.code;
    button.append(createLineBadge(line), document.createTextNode(` ${line.name}`));
    button.addEventListener('click', () => onSelectLine(line.code));
    item.append(button);
    list.append(item);
  }
  root.append(list);

  for (const detail of lineStopDetails) {
    const section = document.createElement('section');
    section.dataset.lineStopDetail = detail.lineCode;
    const title = document.createElement('h3');
    title.textContent = translateCurrent('lineStopDepartures', { line: detail.lineCode });
    section.append(title);
    if (detail.provenance.kind !== 'municipal') {
      const source = document.createElement('p');
      source.dataset.lineStopSource = detail.provenance.kind;
      source.textContent = translateCurrent(
        detail.provenance.kind === 'provisional-fixture' ? 'provisionalSourceLabel' : 'sourceLabel',
        { source: detail.provenance.sourceName }
      );
      section.append(source);
    }
    if (detail.provenance.kind === 'provisional-fixture') {
      const warning = document.createElement('p');
      warning.dataset.provisionalWarning = 'true';
      warning.setAttribute('role', 'note');
      warning.textContent = translateCurrent('provisionalDataWarning');
      section.append(warning);
    }
    const departures = document.createElement('ul');
    for (const pattern of detail.patterns) {
      const item = document.createElement('li');
      const direction = pattern.direction ? `${pattern.direction}: ` : '';
      item.textContent = `${direction}${pattern.departureTimes.join(', ')}`;
      departures.append(item);
    }
    section.append(departures);
    root.append(section);
  }
}

export function renderServingLinesLoading(root: HTMLElement): void {
  root.replaceChildren();
  const status = document.createElement('p');
  status.dataset.servingLinesStatus = 'loading';
  status.setAttribute('role', 'status');
  status.textContent = translateCurrent('servingLinesLoading');
  root.append(status);
}
