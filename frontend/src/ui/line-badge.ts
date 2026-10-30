import type { Line } from '../domain/types';
import { translateCurrent } from '../i18n';

const FALLBACK_COLOR = '#595959';
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function luminance(hex: string): number {
  const [red, green, blue] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

export function readableTextColor(background: string): '#000000' | '#FFFFFF' {
  const light = luminance(background);
  return (light + 0.05) / 0.05 >= 1.05 / (light + 0.05) ? '#000000' : '#FFFFFF';
}

export function lineCodeFromId(lineId: string): string {
  return lineId.replace(/^line-/, '').toUpperCase();
}

export function createLineBadge(line: { code: string; color?: string | null }): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = 'line-badge';
  badge.dataset.lineCodeBadge = 'true';
  badge.textContent = line.code;
  const color = line.color && HEX_COLOR.test(line.color) ? line.color : FALLBACK_COLOR;
  badge.style.backgroundColor = color;
  badge.style.color = readableTextColor(color);
  return badge;
}

export function createLineBadges(
  lineIds: string[],
  lines: Line[],
  onSelectLine?: (line: Line) => void
): HTMLSpanElement {
  const group = document.createElement('span');
  group.className = 'line-badges';
  for (const lineId of lineIds) {
    const line = lines.find((candidate) => candidate.id === lineId);
    const badge = createLineBadge(line ?? { code: lineCodeFromId(lineId) });
    if (line && onSelectLine) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'line-route-link';
      button.dataset.lineRoute = line.code;
      button.setAttribute('aria-label', translateCurrent('openLineRoute', { line: line.code }));
      button.append(badge);
      button.addEventListener('click', () => onSelectLine(line));
      group.append(button);
    } else {
      group.append(badge);
    }
  }
  return group;
}
