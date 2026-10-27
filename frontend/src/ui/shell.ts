import { translateCurrent } from '../i18n';
import { setIconButton } from './icons';
import { createSheet, type SheetController, type SheetLayout } from './panel/sheet';

export type Destination = 'map' | 'search' | 'lines' | 'saved';

const destinationKeys = {
  map: 'navMap',
  search: 'navSearch',
  lines: 'navLines',
  saved: 'navSaved'
} as const;

export interface ShellController {
  readonly header: HTMLElement;
  readonly nav: HTMLElement;
  readonly main: HTMLElement;
  readonly panel: HTMLElement;
  readonly base: HTMLElement;
  onDestinationChange(listener: (destination: Destination) => void): () => void;
  navigate(destination: Destination): void;
  openPanel(title: string, content: HTMLElement, opener?: HTMLElement): void;
  closePanel(): void;
  destroy(): void;
}

export function createShell(container: HTMLElement): ShellController {
  const shell = document.createElement('div');
  shell.className = 'app-shell';
  const header = document.createElement('header');
  header.className = 'app-header';
  const brand = document.createElement('span');
  brand.className = 'app-brand';
  brand.textContent = translateCurrent('appTitle');
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'settings-trigger';
  setIconButton(settings, 'language', translateCurrent('language'));
  settings.setAttribute('aria-haspopup', 'menu');
  header.append(brand, settings);

  const panel = document.createElement('aside');
  panel.className = 'context-panel';
  panel.setAttribute('aria-label', 'Details');
  panel.hidden = true;

  const main = document.createElement('main');
  main.className = 'destination-view';
  const base = document.createElement('div');
  base.className = 'map-base';
  const nav = document.createElement('nav');
  nav.className = 'primary-nav';
  nav.setAttribute('aria-label', 'Main');
  let destination: Destination = 'map';
  let panelOpen = false;
  let panelOpener: HTMLElement | undefined;
  let activeSheet: SheetController | undefined;
  let destroyed = false;
  const destinationListeners = new Set<(destination: Destination) => void>();

  const renderDestination = (next: Destination, focus: boolean) => {
    destination = next;
    main.dataset.destination = next;
    main.replaceChildren();
    const heading = document.createElement('h1');
    heading.tabIndex = -1;
    heading.textContent = translateCurrent(destinationKeys[next]);
    main.append(heading);
    document.title = `${heading.textContent} | ${translateCurrent('appTitle')}`;
    for (const button of Array.from(nav.querySelectorAll<HTMLButtonElement>('[data-destination]'))) {
      if (button.dataset.destination === next) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    if (focus) heading.focus();
    for (const listener of destinationListeners) listener(next);
  };

  const navIcons = { map: 'map', search: 'search', lines: 'lines', saved: 'saved' } as const;
  for (const key of ['map', 'search', 'lines', 'saved'] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.destination = key;
    setIconButton(button, navIcons[key], translateCurrent(destinationKeys[key]));
    // Re-selecting an open overlay toggles it off and returns to the map.
    button.addEventListener('click', () => controller.navigate(key !== 'map' && key === destination ? 'map' : key));
    nav.append(button);
  }

  const clearPanel = (restoreFocus: boolean) => {
    if (!panelOpen) return;
    activeSheet?.destroy();
    activeSheet = undefined;
    panel.replaceChildren();
    panel.hidden = true;
    panelOpen = false;
    const opener = panelOpener;
    panelOpener = undefined;
    window.dispatchEvent(new CustomEvent('vbn:panel-close'));
    if (!restoreFocus) return;
    if (opener?.isConnected) opener.focus();
    else if (destination === 'map') {
      (base.querySelector<HTMLElement>('[data-stops-in-view]') ?? main.querySelector<HTMLElement>('h1'))?.focus();
    } else main.querySelector<HTMLElement>('h1')?.focus();
  };

  const onPopState = (event: PopStateEvent) => {
    const state = event.state as { destination?: Destination } | null;
    if (panelOpen) clearPanel(true);
    if (state?.destination && state.destination !== destination) renderDestination(state.destination, true);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && panelOpen) {
      event.preventDefault();
      clearPanel(true);
      history.replaceState({ destination }, '', location.href);
    }
  };
  const onAppNavigate = (event: Event) => {
    const next = (event as CustomEvent<Destination>).detail;
    if (['map', 'search', 'lines', 'saved'].includes(next)) controller.navigate(next);
  };

  const controller: ShellController = {
    header,
    nav,
    main,
    panel,
    base,
    onDestinationChange(listener) {
      destinationListeners.add(listener);
      return () => destinationListeners.delete(listener);
    },
    navigate(next) {
      if (panelOpen) clearPanel(false);
      history.pushState({ destination: next }, '', location.href);
      renderDestination(next, true);
    },
    openPanel(title, content, opener) {
      if (!panelOpen) history.pushState({ destination, panel: true }, '', location.href);
      panelOpen = true;
      panelOpener = opener;
      activeSheet?.destroy();
      activeSheet = undefined;
      panel.replaceChildren();
      const width = window.innerWidth;
      const height = window.innerHeight;
      const layout: SheetLayout | undefined = width < 600 ? 'phone'
        : width < 1024 && height > width ? 'tablet-portrait'
          : undefined;
      if (layout) {
        activeSheet = createSheet(panel, {
          layout,
          reducedMotion: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
        });
        panel.hidden = false;
        activeSheet.open(title, content, opener);
        return;
      }
      const heading = document.createElement('h2');
      heading.tabIndex = -1;
      heading.textContent = title;
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'panel-close';
      setIconButton(close, 'close', translateCurrent('close'));
      close.addEventListener('click', () => controller.closePanel());
      const panelHeader = document.createElement('div');
      panelHeader.className = 'panel-header';
      panelHeader.append(heading, close);
      panel.append(panelHeader, content);
      panel.hidden = false;
      heading.focus();
    },
    closePanel() {
      clearPanel(true);
      history.replaceState({ destination }, '', location.href);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearPanel(false);
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('vbn:navigate', onAppNavigate);
      destinationListeners.clear();
      container.replaceChildren();
    }
  };

  shell.append(header, nav, main, panel, base);
  container.replaceChildren(shell);
  history.replaceState({ destination }, '', location.href);
  window.addEventListener('popstate', onPopState);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('vbn:navigate', onAppNavigate);
  renderDestination(destination, false);
  return controller;
}