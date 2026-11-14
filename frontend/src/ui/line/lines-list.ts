import type { Line } from '../../domain/types';
import { translateCurrent } from '../../i18n';
import { renderContentState } from '../content-state';
import { createLineBadge } from '../line-badge';
import { createIcon } from '../icons';

export function renderLinesList(
  root: HTMLElement,
  lines: Line[],
  onSelect: (line: Line) => void,
  options: { unavailable?: boolean } = {}
): void {
  root.replaceChildren();
  const heading = document.createElement('h1');
  heading.textContent = translateCurrent('navLines');
  root.append(heading);
  if (options.unavailable) {
    const status = document.createElement('p');
    status.dataset.lineCatalogStatus = 'unavailable';
    status.setAttribute('role', 'status');
    status.textContent = translateCurrent('lineCatalogUnavailable');
    root.append(status);
  }
  const search = document.createElement('form');
  search.className = 'lines-search search-field';
  search.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'search';
  input.setAttribute('aria-label', translateCurrent('searchLines'));
  input.placeholder = translateCurrent('searchLines');
  search.append(createIcon('search'), input);
  const list = document.createElement('ul');
  list.className = 'lines-results';

  const render = () => {
    const query = input.value.trim().toLocaleLowerCase();
    const matches = lines.filter((line) => `${line.code} ${line.name}`.toLocaleLowerCase().includes(query));
    list.replaceChildren();
    if (matches.length === 0) {
      const empty = document.createElement('li');
      renderContentState(empty, 'empty', {
        message: translateCurrent('searchNoResults', { query: input.value.trim() }),
        action: { label: translateCurrent('clearSearch'), onActivate: () => { input.value = ''; render(); input.focus(); } }
      });
      list.append(empty);
      return;
    }
    for (const line of matches) {
      const item = document.createElement('li');
      item.dataset.lineRow = line.id;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'line-list-item';
      const badge = createLineBadge(line);
      const name = document.createElement('span');
      name.textContent = line.name;
      button.append(badge, name);
      button.addEventListener('click', () => onSelect(line));
      item.append(button);
      list.append(item);
    }
  };
  input.addEventListener('input', render);
  search.addEventListener('submit', (event) => event.preventDefault());
  root.append(search, list);
  render();
}