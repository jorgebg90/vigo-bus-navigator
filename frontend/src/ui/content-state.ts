export type ContentStateKind = 'loading' | 'empty' | 'error' | 'offline';

export interface ContentStateOptions {
  message: string;
  action?: { label: string; onActivate: () => void };
}

/** Renders one consistent status block; errors are announced assertively, the rest politely. */
export function renderContentState(root: HTMLElement, kind: ContentStateKind, options: ContentStateOptions): HTMLElement {
  const block = document.createElement('div');
  block.className = 'content-state';
  block.dataset.contentState = kind;
  block.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  const message = document.createElement('p');
  message.textContent = options.message;
  block.append(message);
  if (options.action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.contentStateAction = 'true';
    button.textContent = options.action.label;
    button.addEventListener('click', options.action.onActivate);
    block.append(button);
  }
  root.replaceChildren(block);
  return block;
}
