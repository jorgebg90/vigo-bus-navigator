import { translateCurrent } from '../../i18n';
import { setIconButton } from '../icons';
import { createLineBadge } from '../line-badge';

export interface LineLoadingOptions {
  lineCode: string;
  lineColor?: string | null;
  onClose?: () => void;
}

export function renderLineLoading(root: HTMLElement, options: LineLoadingOptions): void {
  root.replaceChildren();
  root.classList.remove('line-view');
  root.classList.add('line-loading-view');
  root.setAttribute('aria-busy', 'true');

  const header = document.createElement('div');
  header.className = 'line-view-header';
  const heading = document.createElement('h1');
  heading.append(createLineBadge({ code: options.lineCode, color: options.lineColor }));
  header.append(heading);
  if (options.onClose) {
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'line-view-close';
    close.dataset.lineDetailClose = 'true';
    setIconButton(close, 'close', translateCurrent('close'));
    close.addEventListener('click', options.onClose);
    header.append(close);
  }
  const status = document.createElement('p');
  status.dataset.lineLoading = 'true';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = translateCurrent('loadingLineRoute');
  root.append(header, status);
}
