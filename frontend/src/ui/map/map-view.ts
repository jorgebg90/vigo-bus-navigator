import type { MapPort } from '../../application/ports';
import type { Stop } from '../../domain/types';
import { translateCurrent } from '../../i18n';

const VIGO_LAT: [number, number] = [42.19, 42.31];
const VIGO_LON: [number, number] = [-8.79, -8.67];

function hasPlausibleGeometry(stop: Stop): boolean {
  return Number.isFinite(stop.lat) && Number.isFinite(stop.lon)
    && stop.lat >= VIGO_LAT[0] && stop.lat <= VIGO_LAT[1]
    && stop.lon >= VIGO_LON[0] && stop.lon <= VIGO_LON[1];
}

export function renderMap(root: HTMLElement, map: MapPort, stops: Stop[], theme: 'light' | 'dark' = 'light', tilesAvailable = true): () => void {
  root.replaceChildren();
  root.className = 'map-panel';
  const anomalies = stops.filter((stop) => !hasPlausibleGeometry(stop));
  if (anomalies.length > 0) {
    const notice = document.createElement('p');
    notice.textContent = translateCurrent('mapDataAnomaly', { count: anomalies.length });
    notice.setAttribute('role', 'status');
    root.append(notice);
  }
  const mappable = stops.filter(hasPlausibleGeometry);
  const container = document.createElement('div');
  container.className = 'map-container';
  root.append(container);
  map.mount(container, { theme });
  map.showStops(mappable, {});
  map.fitTo(mappable.map((stop) => stop.id));
  if (!tilesAvailable) {
    const notice = document.createElement('p');
    notice.textContent = translateCurrent('mapUnavailable');
    notice.setAttribute('role', 'status');
    root.append(notice);
    const list = document.createElement('ul');
    list.setAttribute('aria-label', translateCurrent('stops'));
    for (const stop of stops) {
      const item = document.createElement('li');
      item.textContent = `${stop.name} (${stop.code}) - lines: ${stop.lineIds.join(', ')} - ${stop.lat}, ${stop.lon}`;
      list.append(item);
    }
    root.append(list);
  }
  return () => map.unmount();
}
