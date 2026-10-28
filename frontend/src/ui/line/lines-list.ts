import type { Line } from '../../domain/types';
import { translateCurrent } from '../../i18n';
import { createLineBadge } from '../line-badge';

export function renderLinesList(
  root: HTMLElement,
  lines: Line[],
  onSelect: (line: Line) => void,
  options: { unavailable?: boolean } = {}
): void {
  root.replaceChildren();
  if (options.unavailable) {
    const status = document.createElement('p');
    status.dataset.lineCatalogStatus = 'unavailable';
    status.setAttribute('role', 'status');
    status.textContent = translateCurrent('lineCatalogUnavailable');
    root.append(status);
  }
  const search = document.createElement('form');
  search.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'search';
  input.setAttribute('aria-label', translateCurrent('searchLines'));
  input.placeholder = translateCurrent('searchLines');
  search.append(input);
  const list = document.createElement('ul');

  const render = () => {
    const query = input.value.trim().toLocaleLowerCase();
    const matches = lines.filter((line) => `${line.code} ${line.name}`.toLocaleLowerCase().includes(query));
    list.replaceChildren();
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