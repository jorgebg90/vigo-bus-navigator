import type { Stop } from '../../domain/types';
import { translateCurrent } from '../../i18n';

export function renderStopMarkers(root: HTMLElement, stops: Stop[], onSelect: (stop: Stop) => void): void {
  root.replaceChildren();
  const list = document.createElement('ul');
  list.setAttribute('aria-label', translateCurrent('mapStops'));
  for (const stop of stops) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${stop.name} (${stop.code}) - ${stop.lineIds.join(', ')}`;
    button.addEventListener('click', () => onSelect(stop));
    item.append(button);
    list.append(item);
  }
  root.append(list);
}
