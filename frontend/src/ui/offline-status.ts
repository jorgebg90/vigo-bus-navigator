import { translateCurrent } from '../i18n';

export function mountOfflineStatus(root: HTMLElement): () => void {
  const notice = document.createElement('p');
  notice.setAttribute('role', 'status');
  notice.hidden = navigator.onLine;
  notice.textContent = translateCurrent('offline');
  root.append(notice);
  const update = () => { notice.hidden = navigator.onLine; };
  const updateLanguage = () => { notice.textContent = translateCurrent('offline'); };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  window.addEventListener('vbn:language-change', updateLanguage);
  return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); window.removeEventListener('vbn:language-change', updateLanguage); notice.remove(); };
}
