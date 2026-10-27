// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createShell, type ShellController } from '../../src/ui/shell';
import { setDocumentLanguage } from '../../src/i18n';

let controllers: ShellController[] = [];

beforeEach(() => {
  controllers = [];
  document.body.replaceChildren();
  history.replaceState(null, '', '/');
  setDocumentLanguage('en');
});
afterEach(() => controllers.forEach((controller) => controller.destroy()));

function mount(root: HTMLElement): ShellController {
  const controller = createShell(root);
  controllers.push(controller);
  return controller;
}

describe('panel focus and history', () => {
  it('focuses each replacement panel heading without trapping focus', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const shell = mount(root);
    const opener = document.createElement('button');
    root.append(opener);
    opener.focus();

    shell.openPanel('Central', document.createElement('p'), opener);
    expect(document.activeElement).toBe(root.querySelector('aside[aria-label="Details"] h2'));
    expect(root.querySelector('aside[aria-label="Details"]')?.hasAttribute('aria-modal')).toBe(false);

    shell.openPanel('Bouzas', document.createElement('p'), opener);
    expect(document.activeElement?.textContent).toBe('Bouzas');
  });

  it('closes the panel on Escape and returns focus to its opener', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const shell = mount(root);
    const opener = document.createElement('button');
    root.append(opener);

    shell.openPanel('Central', document.createElement('p'), opener);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(root.querySelector('aside[aria-label="Details"]')?.textContent).toBe('');
    expect(document.activeElement).toBe(opener);
  });

  it('browser Back closes an open panel before changing destination', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const shell = mount(root);
    const opener = document.createElement('button');
    root.append(opener);

    shell.navigate('search');
    shell.openPanel('Central', document.createElement('p'), opener);
    window.dispatchEvent(new PopStateEvent('popstate', { state: { destination: 'search' } }));

    expect(root.querySelector('aside[aria-label="Details"]')?.textContent).toBe('');
    expect(root.querySelector('main h1')?.textContent).toBe('Search');
    const previousDestination = new PopStateEvent('popstate');
    Object.defineProperty(previousDestination, 'state', { value: { destination: 'map' } });
    window.dispatchEvent(previousDestination);
    expect(root.querySelector('main h1')?.textContent).toBe('Map');
  });

  it('falls back to the destination heading when the opener no longer exists', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const shell = mount(root);
    const opener = document.createElement('button');
    root.append(opener);
    shell.openPanel('Central', document.createElement('p'), opener);
    opener.remove();
    shell.closePanel();

    expect(document.activeElement).toBe(root.querySelector('main h1'));
  });

  it('keeps DOM landmarks in the intended keyboard order', () => {
    const root = document.createElement('div');
    document.body.append(root);
    mount(root);
    const shellRoot = root.querySelector('.app-shell')!;
    const landmarks = ['header', 'nav', 'main', 'aside'].map((selector) => shellRoot.querySelector(selector));
    expect(landmarks.every(Boolean)).toBe(true);
    expect(landmarks[0]!.compareDocumentPosition(landmarks[1]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(landmarks[1]!.compareDocumentPosition(landmarks[2]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(landmarks[2]!.compareDocumentPosition(landmarks[3]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
