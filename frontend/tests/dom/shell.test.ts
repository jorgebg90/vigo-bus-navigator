// @vitest-environment happy-dom
import { afterEach, describe, expect, it, beforeEach } from 'vitest';
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
afterEach(() => controllers.forEach((controller) => controller.destroy()));

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
      .toEqual(['Map', 'Search', 'Lines', 'Saved']);

    for (const [destination, label] of [['map', 'Map'], ['search', 'Search'], ['lines', 'Lines'], ['saved', 'Saved']] as const) {
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

  it('keeps navigation in source order as icon-only buttons with accessible names', () => {
    const root = document.createElement('div');
    document.body.append(root);
    mount(root);
    const labels = [...root.querySelectorAll('nav[aria-label="Main"] [data-destination]')];
    expect(labels.map((node) => node.getAttribute('data-destination'))).toEqual(['map', 'search', 'lines', 'saved']);
    expect(labels.every((node) => node.getAttribute('aria-label') && !node.textContent?.trim() && node.querySelector('svg'))).toBe(true);
    const css = readFileSync(resolve(import.meta.dirname, '../../src/ui/styles.css'), 'utf8');
    expect(css).not.toContain('text-overflow: ellipsis');
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
});
