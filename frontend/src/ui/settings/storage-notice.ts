import { translateCurrent } from '../../i18n';

export function showStorageNotice(root: HTMLElement): void {
  if (root.querySelector('[data-storage-notice]')) return;
  const notice = document.createElement('div');
  notice.dataset.storageNotice = 'true';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  const message = document.createElement('span');
  message.textContent = translateCurrent('favoritesCannotSave');
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.dataset.dismiss = 'true';
  dismiss.textContent = translateCurrent('close');
  dismiss.addEventListener('click', () => notice.remove());
  notice.append(message, dismiss);
  root.prepend(notice);
}
