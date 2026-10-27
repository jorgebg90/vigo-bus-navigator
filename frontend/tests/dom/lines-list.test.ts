// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderLinesList } from '../../src/ui/line/lines-list';
import { setDocumentLanguage } from '../../src/i18n';
import type { Line } from '../../src/domain/types';

const lines: Line[] = [
  { id: 'line-4a', code: '4A', name: 'Praza de América', color: '#9B2F3B' },
  { id: 'line-7', code: '7', name: 'Bouzas', color: '#14532D' }
];

beforeEach(() => setDocumentLanguage('en'));

describe('lines list', () => {
  it('lists every line with a readable badge, code, and name', () => {
    const root = document.createElement('main');
    renderLinesList(root, lines, () => undefined);

    expect(root.querySelector('[role="search"]')).toBeTruthy();
    expect(root.querySelectorAll('[data-line-code-badge]')).toHaveLength(2);
    expect(root.textContent).toContain('4A');
    expect(root.textContent).toContain('Praza de América');
    expect(root.textContent).toContain('Bouzas');
    expect(root.querySelector('[data-results-count]')).toBeNull();
  });

  it('filters by code or name and selects results with the keyboard', () => {
    const root = document.createElement('main');
    const select = vi.fn();
    renderLinesList(root, lines, select);
    const search = root.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'bouz';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(root.querySelectorAll('[data-line-row]')).toHaveLength(1);
    const result = root.querySelector<HTMLButtonElement>('[data-line-row] button')!;
    result.focus();
    result.click();
    expect(select).toHaveBeenCalledWith(lines[1]);
  });
});
