import type { Favorite } from '../domain/types';
import { translateCurrent } from '../i18n';

export interface FavoriteToggleOptions {
  type: Favorite['type'];
  name: string;
  saved: boolean;
  onToggle: () => void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const STAR_PATH = 'M12 2.8l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.6l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z';

export function createStarIcon(filled: boolean): SVGSVGElement {
  const icon = document.createElementNS(SVG_NS, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('width', '24');
  icon.setAttribute('height', '24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', STAR_PATH);
  path.setAttribute('fill', filled ? 'currentColor' : 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linejoin', 'round');
  icon.append(path);
  return icon;
}

export function renderFavoriteToggle(root: HTMLElement, options: FavoriteToggleOptions): HTMLButtonElement {
  root.replaceChildren();
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'favorite-toggle';
  const update = (saved: boolean) => {
    const label = translateCurrent(saved ? 'removeFavoriteNamed' : 'saveFavorite', { name: options.name });
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', label);
    button.title = label;
    button.replaceChildren(createStarIcon(saved));
  };
  let saved = options.saved;
  update(saved);
  button.addEventListener('click', () => {
    options.onToggle();
    saved = !saved;
    update(saved);
  });
  root.append(button);
  return button;
}