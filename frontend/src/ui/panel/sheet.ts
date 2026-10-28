import { translateCurrent } from '../../i18n';
import { setIconButton } from '../icons';

export type SheetLayout = 'phone' | 'tablet-portrait' | 'landscape' | 'desktop';

export interface SheetOptions {
  layout: SheetLayout;
  reducedMotion?: boolean;
}

export interface SheetController {
  open(title: string, content: HTMLElement, opener?: HTMLElement): void;
  expand(): void;
  collapse(): void;
  close(): void;
  destroy(): void;
}

export function createSheet(root: HTMLElement, options: SheetOptions): SheetController {
  let panel: HTMLElement | undefined;
  let opener: HTMLElement | undefined;
  let expanded = false;

  const close = () => {
    if (!panel) return;
    panel.remove();
    panel = undefined;
    expanded = false;
    const previousOpener = opener;
    opener = undefined;
    if (previousOpener?.isConnected) previousOpener.focus();
  };

  const setExpanded = (value: boolean) => {
    if (!panel) return;
    expanded = value;
    panel.dataset.snap = expanded ? 'expanded' : 'peek';
    const toggle = panel.querySelector<HTMLButtonElement>('[data-sheet-toggle]');
    if (toggle) {
      toggle.textContent = translateCurrent(expanded ? 'collapse' : 'expand');
      toggle.setAttribute('aria-expanded', String(expanded));
    }
    panel.style.height = expanded
      ? 'min(85vh, 85dvh)'
      : options.layout === 'phone'
        ? '45dvh'
        : '96px';
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && panel) {
      event.preventDefault();
      close();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  return {
    open(title, content, trigger) {
      close();
      opener = trigger;
      panel = document.createElement('aside');
      panel.className = 'detail-sheet';
      panel.dataset.sheet = 'true';
      panel.dataset.snap = 'peek';
      panel.dataset.motion = options.reducedMotion ? 'instant' : 'standard';
      panel.setAttribute('aria-label', title);
      panel.style.transitionDuration = options.reducedMotion ? '0ms' : '200ms';
      if (options.layout === 'phone') panel.style.maxHeight = '85vh';
      if (options.layout === 'tablet-portrait') panel.style.maxHeight = '50vh';
      if (options.layout === 'landscape') panel.style.width = '360px';
      if (options.layout === 'desktop') {
        panel.style.minWidth = '340px';
        panel.style.maxWidth = '400px';
        panel.style.width = '100%';
      }
      const header = document.createElement('div');
      header.className = 'sheet-header';
      const heading = document.createElement('h2');
      heading.tabIndex = -1;
      heading.textContent = title;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.dataset.sheetToggle = 'true';
      toggle.textContent = translateCurrent('expand');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', () => setExpanded(!expanded));
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.dataset.sheetClose = 'true';
      setIconButton(closeButton, 'close', translateCurrent('close'));
      closeButton.addEventListener('click', close);
      const body = document.createElement('div');
      body.className = 'sheet-content';
      body.append(content);
      header.append(heading, toggle, closeButton);
      panel.append(header, body);
      root.append(panel);
      setExpanded(false);
      heading.focus();
    },
    expand() { setExpanded(true); },
    collapse() { setExpanded(false); },
    close,
    destroy() {
      close();
      document.removeEventListener('keydown', onKeyDown);
    }
  };
}