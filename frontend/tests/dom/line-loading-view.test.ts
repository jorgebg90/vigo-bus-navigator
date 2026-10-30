// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { setDocumentLanguage } from '../../src/i18n';
import { renderLineLoading } from '../../src/ui/line/line-loading-view';

describe('line loading view', () => {
  beforeEach(() => setDocumentLanguage('en'));

  it('announces line loading accessibly without blocking the interface', () => {
    const root = document.createElement('section');

    renderLineLoading(root, { lineCode: '4A' });

    const status = root.querySelector('[data-line-loading]');
    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.textContent).toBe('Loading line route…');
    expect(root.querySelector('[disabled]')).toBeNull();
  });

  it('keeps an accessible close action available while loading', () => {
    const root = document.createElement('section');
    let closed = false;

    renderLineLoading(root, { lineCode: '4A', onClose: () => { closed = true; } });

    const close = root.querySelector<HTMLButtonElement>('[data-line-detail-close]');
    expect(close?.getAttribute('aria-label')).toBe('Close');
    close?.click();
    expect(closed).toBe(true);
  });
});
