import type { Line } from '../../domain/types';
import { translateCurrent } from '../../i18n';

export interface LineCatalogOptions {
  lines: Line[];
  onSelect: (line: Line) => void;
}

export function renderLineCatalog(root: HTMLElement, options: LineCatalogOptions): void {
  root.replaceChildren();
  const heading = document.createElement('h1');
  heading.textContent = translateCurrent('appTitle');
  root.append(heading);
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = translateCurrent('searchLines');
  search.setAttribute('aria-label', translateCurrent('searchLines'));
  root.append(search);
  const list = document.createElement('ul');
  list.setAttribute('aria-label', translateCurrent('busLines'));
  root.append(list);

  const render = () => {
    const query = search.value.trim().toLocaleLowerCase();
    list.replaceChildren();
    options.lines
      .filter((line) => `${line.code} ${line.name}`.toLocaleLowerCase().includes(query))
      .forEach((line) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${line.code} - ${line.name}`;
        button.addEventListener('click', () => options.onSelect(line));
        item.append(button);
        list.append(item);
      });
  };
  search.addEventListener('input', render);
  render();
}
