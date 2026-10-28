import type { Provenance, Stop } from '../../domain/types';
import { renderFavoriteToggle } from '../favorite-toggle';
import { translateCurrent } from '../../i18n';

export interface StopSearchOptions {
  stops: Stop[];
  favoriteStopIds: string[];
  onSelect: (stopId: string) => void;
  onFavoriteToggle: (stopId: string) => void;
  discoveryProvenance?: Provenance;
}

export function renderStopSearch(root: HTMLElement, options: StopSearchOptions): void {
  root.replaceChildren();
  const landmark = document.createElement('div');
  landmark.setAttribute('role', 'search');
  const search = document.createElement('input');
  search.type = 'search';
  search.setAttribute('aria-label', translateCurrent('stopSearch'));
  search.placeholder = translateCurrent('stopSearch');
  const results = document.createElement('ul');
  results.setAttribute('aria-label', translateCurrent('stops'));
  landmark.append(search);
  if (options.discoveryProvenance?.kind === 'bundled-catalog') {
    const notice = document.createElement('p');
    notice.dataset.stopDiscoverySource = options.discoveryProvenance.kind;
    notice.textContent = translateCurrent('bundledDiscoveryNotice', {
      date: options.discoveryProvenance.snapshotDate ?? ''
    });
    root.append(notice);
  }
  root.append(landmark, results);

  const render = () => {
    const query = search.value.trim().toLocaleLowerCase();
    const matches = options.stops.filter((stop) => `${stop.name} ${stop.code}`.toLocaleLowerCase().includes(query));
    results.replaceChildren();
    if (matches.length === 0) {
      const item = document.createElement('li');
      const message = document.createElement('p');
      message.textContent = translateCurrent('noStopsFound', { query });
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.dataset.clearSearch = 'true';
      clear.textContent = translateCurrent('clearSearch');
      clear.addEventListener('click', () => { search.value = ''; render(); search.focus(); });
      item.append(message, clear);
      results.append(item);
      return;
    }
    for (const stop of matches) {
      const row = document.createElement('li');
      row.dataset.stopRow = stop.id;
      const open = document.createElement('button');
      open.type = 'button';
      open.dataset.stopOpen = stop.id;
      open.className = 'stop-open';
      open.textContent = stop.name;
      open.addEventListener('click', () => options.onSelect(stop.id));
      row.append(open);
      if (stop.lat === null || stop.lon === null) {
        const noPosition = document.createElement('span');
        noPosition.dataset.mapPosition = 'missing';
        noPosition.textContent = translateCurrent('noMapPosition');
        row.append(noPosition);
      }
      const favorite = document.createElement('div');
      renderFavoriteToggle(favorite, {
        type: 'stop',
        name: stop.name,
        saved: options.favoriteStopIds.includes(stop.id),
        onToggle: () => options.onFavoriteToggle(stop.id)
      });
      row.append(favorite);
      results.append(row);
    }
  };
  search.addEventListener('input', render);
  render();
}