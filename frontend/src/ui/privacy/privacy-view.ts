const attributionSource = 'https://carto.com/attribution/';

export function renderMapAttribution(root: HTMLElement): HTMLElement {
  const strip = document.createElement('div');
  strip.className = 'map-attribution-strip';
  strip.setAttribute('aria-label', 'Map attribution');
  const osm = document.createElement('a');
  osm.href = 'https://www.openstreetmap.org/copyright';
  osm.textContent = '© OpenStreetMap contributors';
  const carto = document.createElement('a');
  carto.href = attributionSource;
  carto.textContent = '© CARTO';
  strip.append(osm, document.createTextNode(', '), carto);
  root.append(strip);
  return strip;
}