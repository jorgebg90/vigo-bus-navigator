import type { StopMapPort } from '../../application/ports';
import { translateCurrent } from '../../i18n';
import { setIconButton } from '../icons';

export interface MapToolbarOptions {
  map: StopMapPort;
  onRecenter?: () => void;
}

export function renderMapToolbar(root: HTMLElement, options: MapToolbarOptions): void {
  const toolbar = document.createElement('div');
  toolbar.className = 'map-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', translateCurrent('mapControls'));

  const recenter = document.createElement('button');
  recenter.type = 'button';
  recenter.dataset.recenter = 'true';
  setIconButton(recenter, 'recenter', translateCurrent('recenter'));
  recenter.addEventListener('click', () => {
    options.map.fitToStops(true);
    options.onRecenter?.();
  });

  const zoomIn = document.createElement('button');
  zoomIn.type = 'button';
  zoomIn.dataset.zoom = 'in';
  setIconButton(zoomIn, 'plus', translateCurrent('zoomIn'));
  zoomIn.addEventListener('click', () => options.map.zoomIn());

  const zoomOut = document.createElement('button');
  zoomOut.type = 'button';
  zoomOut.dataset.zoom = 'out';
  setIconButton(zoomOut, 'minus', translateCurrent('zoomOut'));
  zoomOut.addEventListener('click', () => options.map.zoomOut());

  const zoomGroup = document.createElement('div');
  zoomGroup.className = 'map-zoom-group';
  zoomGroup.append(zoomIn, zoomOut);

  toolbar.append(recenter, zoomGroup);
  root.append(toolbar);
}
