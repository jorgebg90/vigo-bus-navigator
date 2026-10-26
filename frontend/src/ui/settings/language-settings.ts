import type { Language } from '../../domain/types';
import type { StoragePort } from '../../application/ports';
import { setDocumentLanguage, translateCurrent } from '../../i18n';

export function renderLanguageSettings(root: HTMLElement, storage: StoragePort): void {
  root.replaceChildren();
  const label = document.createElement('label');
  label.textContent = translateCurrent('language');
  const select = document.createElement('select');
  select.setAttribute('aria-label', translateCurrent('language'));
  for (const language of ['es', 'gl', 'en'] as Language[]) {
    const option = document.createElement('option');
    option.value = language;
    option.textContent = language === 'es' ? 'Español' : language === 'gl' ? 'Galego' : 'English';
    select.append(option);
  }
  select.value = storage.loadPreferences().language;
  select.addEventListener('change', () => {
    const preferences = storage.loadPreferences();
    const language = select.value as Language;
    storage.savePreferences({ ...preferences, language });
    setDocumentLanguage(language);
  });
  label.append(select);
  root.append(label);
  setDocumentLanguage(select.value as Language);
}
