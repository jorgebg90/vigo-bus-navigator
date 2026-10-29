import type { StopMapPort } from '../../application/ports';
import { toMapStops } from '../../domain/map-stops';
import type { Stop } from '../../domain/types';
import { translateCurrent } from '../../i18n';

export function renderMap(root: HTMLElement, map: StopMapPort, stops: Stop[], theme: 'light' | 'dark' = 'light', tilesAvailable = true): () => void {
  root.replaceChildren();
  root.className = 'map-panel';
  const mappable = toMapStops(stops);
  const container = document.createElement('div');
  container.className = 'map-container';
  root.append(container);
  map.mount(container, { theme, ariaLabel: translateCurrent('mapLabel') });
  map.setStops(mappable);
  map.setSelectedStop(null);
  map.fitToStops();
  if (!tilesAvailable) {
    const notice = document.createElement('p');
    notice.textContent = translateCurrent('mapUnavailable');
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.dataset.mapRetry = 'true';
    retry.textContent = translateCurrent('mapRetry');
    retry.addEventListener('click', () => {
      map.mount(container, { theme, ariaLabel: translateCurrent('mapLabel') });
      map.setStops(mappable);
      map.setSelectedStop(null);
      map.fitToStops();
    });
    const useSearch = document.createElement('button');
    useSearch.type = 'button';
    useSearch.dataset.mapUseSearch = 'true';
    useSearch.textContent = translateCurrent('useSearch');
    useSearch.addEventListener('click', () => window.dispatchEvent(new CustomEvent('vbn:navigate', { detail: 'search' })));
    notice.append(retry, useSearch);
    root.append(notice);
    const list = document.createElement('ul');
    list.setAttribute('aria-label', translateCurrent('stops'));
    for (const stop of stops) {
      const item = document.createElement('li');
      item.textContent = stop.name;
      list.append(item);
    }
    root.append(list);
  }
  return () => map.unmount();
}
