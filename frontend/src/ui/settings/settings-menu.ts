import type { Language } from '../../domain/types';
import type { StoragePort } from '../../application/ports';
import { applyLanguage } from '../i18n-renderer';
import { onLanguageChange, translateCurrent } from '../../i18n';
import { setIconButton } from '../icons';

export interface SettingsMenuController {
  destroy(): void;
}

const languages: Array<{ value: Language; label: string }> = [
  { value: 'es', label: 'Castellano' },
  { value: 'gl', label: 'Galego' },
  { value: 'en', label: 'English' }
];
export function createSettingsMenu(
  root: HTMLElement,
  storage: StoragePort
): SettingsMenuController {
  root.replaceChildren();
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'settings-trigger';
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  const menu = document.createElement('div');
  menu.className = 'settings-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;

  const close = (restoreFocus: boolean) => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
  };

  const addLanguageOptions = (current: Language, choose: (language: Language) => void) => {
    const group = document.createElement('div');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', translateCurrent('language'));
    group.dataset.group = 'language';
    for (const choice of languages) {
      const item = document.createElement('button');
      item.type = 'button';
      item.setAttribute('role', 'menuitemradio');
      item.setAttribute('aria-checked', String(choice.value === current));
      item.dataset.language = choice.value;
      item.textContent = choice.label;
      item.addEventListener('click', () => choose(choice.value));
      group.append(item);
    }
    menu.append(group);
  };

  const render = () => {
    const preferences = storage.loadPreferences();
    setIconButton(trigger, 'language', translateCurrent('language'));
    menu.replaceChildren();
    addLanguageOptions(preferences.language, (language) => {
      storage.savePreferences({ ...storage.loadPreferences(), language });
      applyLanguage(language);
      render();
      close(true);
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (menu.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = Array.from(menu.querySelectorAll<HTMLElement>('button'));
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
  const unsubscribeLanguage = onLanguageChange(() => render());
  trigger.addEventListener('click', () => {
    if (!menu.hidden) {
      close(false);
      return;
    }
    render();
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    menu.querySelector<HTMLElement>('button')?.focus();
  });
  document.addEventListener('keydown', onKeyDown);
  root.append(trigger, menu);
  render();

  return {
    destroy() {
      unsubscribeLanguage();
      document.removeEventListener('keydown', onKeyDown);
      root.replaceChildren();
    }
  };
}