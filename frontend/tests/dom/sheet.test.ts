// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { createSheet } from '../../src/ui/panel/sheet';
import { createShell } from '../../src/ui/shell';
import { setDocumentLanguage } from '../../src/i18n';

beforeEach(() => {
  document.body.replaceChildren();
  setDocumentLanguage('en');
});

describe('responsive detail sheet', () => {
  it('supports peek and expanded snap points with a button alternative to dragging', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const sheet = createSheet(root, { layout: 'phone' });
    sheet.open('Central', document.createElement('p'));
    const panel = root.querySelector('[data-sheet]') as HTMLElement;

    expect(panel.dataset.snap).toBe('peek');
    panel.querySelector<HTMLButtonElement>('[data-sheet-toggle]')?.click();
    expect(panel.dataset.snap).toBe('expanded');
    expect(panel.querySelector('[data-sheet-toggle]')?.textContent).toContain('Collapse');
    panel.querySelector<HTMLButtonElement>('[data-sheet-toggle]')?.click();
    expect(panel.dataset.snap).toBe('peek');
  });

  it('applies phone, tablet, landscape, and desktop size limits', () => {
    const phoneRoot = document.createElement('div');
    const phone = createSheet(phoneRoot, { layout: 'phone' });
    phone.open('Phone', document.createElement('p'));
    expect((phoneRoot.querySelector('[data-sheet]') as HTMLElement).style.maxHeight).toBe('85vh');

    const tabletRoot = document.createElement('div');
    const tablet = createSheet(tabletRoot, { layout: 'tablet-portrait' });
    tablet.open('Tablet', document.createElement('p'));
    expect((tabletRoot.querySelector('[data-sheet]') as HTMLElement).style.maxHeight).toBe('50vh');

    const landscapeRoot = document.createElement('div');
    const landscape = createSheet(landscapeRoot, { layout: 'landscape' });
    landscape.open('Landscape', document.createElement('p'));
    expect((landscapeRoot.querySelector('[data-sheet]') as HTMLElement).style.width).toBe('360px');

    const desktopRoot = document.createElement('div');
    const desktop = createSheet(desktopRoot, { layout: 'desktop' });
    desktop.open('Desktop', document.createElement('p'));
    const desktopPanel = desktopRoot.querySelector('[data-sheet]') as HTMLElement;
    expect(desktopPanel.style.minWidth).toBe('340px');
    expect(desktopPanel.style.maxWidth).toBe('400px');
  });

  it('closes on Close or Escape and respects reduced motion', () => {
    const root = document.createElement('div');
    document.body.append(root);
    let closeCount = 0;
    const sheet = createSheet(root, {
      layout: 'phone',
      reducedMotion: true,
      onClose: () => { closeCount += 1; }
    });
    sheet.open('Central', document.createElement('p'));
    const panel = root.querySelector('[data-sheet]') as HTMLElement;
    expect(panel.dataset.motion).toBe('instant');
    panel.querySelector<HTMLButtonElement>('[data-sheet-close]')?.click();
    expect(root.querySelector('[data-sheet]')).toBeNull();
    expect(closeCount).toBe(1);

    sheet.open('Central', document.createElement('p'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(root.querySelector('[data-sheet]')).toBeNull();
    expect(closeCount).toBe(2);
  });

  it('hosts narrow-screen panels in the sheet component', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    const root = document.createElement('div');
    document.body.append(root);
    const shell = createShell(root);
    shell.openPanel('Central', document.createElement('p'));

    expect(root.querySelector('[data-sheet]')).toBeTruthy();
    expect(root.querySelector('aside[aria-label="Details"] [data-sheet]')?.getAttribute('aria-modal')).toBeNull();
    root.querySelector<HTMLButtonElement>('[data-sheet-close]')?.click();
    expect(root.querySelector<HTMLElement>('aside[aria-label="Details"]')?.hidden).toBe(true);
    expect(root.querySelector('aside[aria-label="Details"] [data-sheet]')).toBeNull();
    shell.destroy();
  });
});
