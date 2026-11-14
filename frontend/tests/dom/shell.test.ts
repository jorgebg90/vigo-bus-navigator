// @vitest-environment happy-dom
import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';
import { createShell, type ShellController } from '../../src/ui/shell';
import { setDocumentLanguage } from '../../src/i18n';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let controllers: ShellController[] = [];

beforeEach(() => {
  controllers = [];
  document.body.replaceChildren();
  document.title = 'Vigo Bus Navigator';
  setDocumentLanguage('en');
});
afterEach(() => {
  controllers.forEach((controller) => controller.destroy());
  vi.restoreAllMocks();
});

function mount(root: HTMLElement): ShellController {
  const controller = createShell(root);
  controllers.push(controller);
  return controller;
}

describe('app shell', () => {
  it('provides landmarks, one destination heading, and current navigation state', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const shell = mount(root);

    expect(root.querySelector('header')).toBeTruthy();
    expect(root.querySelector('nav[aria-label="Main"]')).toBeTruthy();
    expect(root.querySelectorAll('main')).toHaveLength(1);
    expect(root.querySelector('aside[aria-label="Details"]')).toBeTruthy();
    expect(root.querySelectorAll('h1')).toHaveLength(1);
    expect(root.querySelector('[data-destination="map"]')?.getAttribute('aria-current')).toBe('page');
    expect([...root.querySelectorAll('nav [data-destination]')].map((node) => node.getAttribute('aria-label')))
      .toEqual(['Map', 'Search', 'Plan a trip', 'Lines', 'Saved']);

    for (const [destination, label] of [['map', 'Map'], ['search', 'Search'], ['journeys', 'Plan a trip'], ['lines', 'Lines'], ['saved', 'Saved']] as const) {
      shell.navigate(destination);
      expect(root.querySelectorAll('main h1')).toHaveLength(1);
      expect(root.querySelector('main h1')?.textContent).toBe(label);
      expect(document.title).toContain(label);
    }
  });

  it('focuses the new destination heading and updates the document title', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const shell = createShell(root);

    shell.navigate('search');

    expect(document.activeElement).toBe(root.querySelector('main h1'));
    expect(document.title).toContain('Search');
    expect(root.querySelector('[data-destination="search"]')?.getAttribute('aria-current')).toBe('page');
    expect(root.querySelector('[data-destination="map"]')?.hasAttribute('aria-current')).toBe(false);
  });

  it('focuses the rendered content after a destination listener replaces the shell heading', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const shell = mount(root);
    shell.onDestinationChange(() => {
      const heading = document.createElement('h1');
      heading.textContent = 'Plan your journey';
      shell.main.replaceChildren(heading);
    });
    shell.navigate('journeys');
    expect(document.activeElement).toBe(shell.main.querySelector('h1'));
  });

  it('keeps navigation in source order as labeled icon buttons with accessible names', () => {
    const root = document.createElement('div');
    document.body.append(root);
    mount(root);
    const labels = [...root.querySelectorAll('nav[aria-label="Main"] [data-destination]')];
    expect(labels.map((node) => node.getAttribute('data-destination'))).toEqual(['map', 'search', 'journeys', 'lines', 'saved']);
    expect(labels.every((node) => node.getAttribute('aria-label') && node.textContent?.trim() === node.getAttribute('aria-label') && node.querySelector('svg'))).toBe(true);
    const css = readFileSync(resolve(import.meta.dirname, '../../src/ui/styles.css'), 'utf8');
    const navigationRules = [...css.matchAll(/[^{}]*\.primary-nav[^{}]*\{[^{}]*\}/g)]
      .map(([rule]) => rule);
    expect(navigationRules.length).toBeGreaterThan(0);
    expect(navigationRules.join('\n')).not.toContain('text-overflow: ellipsis');
  });

  it('refreshes labels, heading and title when the language changes', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const shell = mount(root);
    shell.navigate('lines');
    setDocumentLanguage('es');
    const lines = root.querySelector('[data-destination="lines"]')!;
    expect(lines.textContent).toBe(lines.getAttribute('aria-label'));
    expect(lines.textContent).not.toBe('Lines');
    expect(root.querySelector('main h1')?.textContent).toBe(lines.textContent);
    expect(document.title).toContain(lines.textContent!);
  });

  it('toggles an open overlay destination back to the map', () => {
    const root = document.createElement('div');
    document.body.append(root);
    mount(root);
    const search = root.querySelector<HTMLButtonElement>('[data-destination="search"]')!;
    search.click();
    expect(root.querySelector('main')?.getAttribute('data-destination')).toBe('search');
    search.click();
    expect(root.querySelector('main')?.getAttribute('data-destination')).toBe('map');
  });

  it('reserves measured mobile navigation space and removes resize work on destroy', () => {
    const width = Object.getOwnPropertyDescriptor(window, 'innerWidth')!;
    const root = document.createElement('div');
    document.body.append(root);
    const shell = mount(root);
    const layout = root.querySelector<HTMLElement>('.app-shell')!;
    vi.spyOn(shell.nav, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 390, 75));
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
    try {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
      window.dispatchEvent(new Event('resize'));
      expect(layout.style.getPropertyValue('--nav-h')).toBe('75px');
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
      window.dispatchEvent(new Event('resize'));
      expect(layout.style.getPropertyValue('--nav-h')).toBe('0px');
      shell.destroy();
      expect(disconnect).toHaveBeenCalled();
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
      window.dispatchEvent(new Event('resize'));
      expect(layout.style.getPropertyValue('--nav-h')).toBe('0px');
    } finally {
      Object.defineProperty(window, 'innerWidth', width);
    }
  });
});
