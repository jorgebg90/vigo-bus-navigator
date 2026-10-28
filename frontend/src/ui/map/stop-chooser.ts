import type { Line, Stop } from '../../domain/types';
import { translateCurrent } from '../../i18n';
import { createLineBadges } from '../line-badge';

export interface StopChooserOptions {
  onSelect: (stopId: string) => void;
  lines?: Line[];
  onClose?: () => void;
}

export interface StopChooserController {
  open(stops: Stop[], center: [number, number], opener: HTMLElement): void;
  close(): void;
  destroy(): void;
}

function distanceSquared(stop: Stop, center: [number, number]): number {
  if (stop.lat === null || stop.lon === null) return Number.POSITIVE_INFINITY;
  const longitude = stop.lon - center[0];
  const latitude = stop.lat - center[1];
  return longitude * longitude + latitude * latitude;
}

export function createStopChooser(root: HTMLElement, options: StopChooserOptions): StopChooserController {
  let dialog: HTMLDialogElement | undefined;
  let opener: HTMLElement | undefined;

  const close = () => {
    if (!dialog) return;
    dialog.close();
    dialog.remove();
    dialog = undefined;
    const previousOpener = opener;
    opener = undefined;
    if (previousOpener?.isConnected) previousOpener.focus();
    options.onClose?.();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !dialog?.open) return;
    const items = Array.from(dialog.querySelectorAll<HTMLElement>('button'));
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  return {
    open(stops, center, trigger) {
      close();
      opener = trigger;
      dialog = document.createElement('dialog');
      dialog.className = 'stop-chooser';
      dialog.setAttribute('aria-label', `Stops here (${stops.length})`);
      dialog.setAttribute('aria-modal', 'true');
      const header = document.createElement('div');
      header.className = 'stop-chooser-header';
      const heading = document.createElement('h2');
      heading.textContent = translateCurrent('stopsHere', { count: stops.length });
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.dataset.chooserClose = 'true';
      closeButton.textContent = translateCurrent('close');
      closeButton.addEventListener('click', close);
      const list = document.createElement('ul');
      header.append(heading, closeButton);
      const ordered = [...stops].sort((left, right) =>
        distanceSquared(left, center) - distanceSquared(right, center) || left.name.localeCompare(right.name)
      );
      for (const stop of ordered) {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'stop-open';
        button.textContent = stop.name;
        button.addEventListener('click', () => {
          const stopId = stop.id;
          close();
          options.onSelect(stopId);
        });
        item.append(button, createLineBadges(stop.lineIds, options.lines ?? []));
        list.append(item);
      }
      dialog.append(header, list);
      dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
      dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
      root.append(dialog);
      dialog.showModal();
      (dialog.querySelector<HTMLButtonElement>('ul button') ?? closeButton).focus();
    },
    close,
    destroy() {
      close();
      document.removeEventListener('keydown', onKeyDown);
    }
  };
}