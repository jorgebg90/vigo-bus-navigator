const SVG_NS = 'http://www.w3.org/2000/svg';

const ICON_PATHS = {
  map: ['M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z', 'M9.5 10a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0'],
  search: ['M5 11a6 6 0 1012 0 6 6 0 10-12 0', 'M16 16l4.5 4.5'],
  lines: ['M6 4h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z', 'M4 11h16', 'M7 18v2.5M17 18v2.5', 'M8 14.5h.01M16 14.5h.01'],
  saved: ['M12 2.8l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.6l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z'],
  language: ['M12 22a10 10 0 110-20 10 10 0 010 20z', 'M2 12h20', 'M12 2a15 15 0 000 20', 'M12 2a15 15 0 010 20'],
  plus: ['M12 5v14M5 12h14'],
  minus: ['M5 12h14'],
  stops: ['M8 6h12M8 12h12M8 18h12', 'M4 6h.01M4 12h.01M4 18h.01'],
  recenter: ['M6 12a6 6 0 1012 0 6 6 0 10-12 0', 'M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4', 'M12 12h.01'],
  close: ['M6 6l12 12M18 6L6 18']
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function createIcon(name: IconName): SVGSVGElement {
  const icon = document.createElementNS(SVG_NS, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('width', '24');
  icon.setAttribute('height', '24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  for (const d of ICON_PATHS[name]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    icon.append(path);
  }
  return icon;
}

/** Turns a button into an icon-only control that keeps a full accessible name. */
export function setIconButton(button: HTMLButtonElement, name: IconName, label: string): void {
  button.setAttribute('aria-label', label);
  button.title = label;
  button.replaceChildren(createIcon(name));
}
