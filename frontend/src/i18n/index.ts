import { messages as es } from './es';
import { messages as gl } from './gl';
import { messages as en } from './en';
import type { Language } from '../domain/types';

export const catalogs = { es, gl, en };
export type MessageKey = keyof typeof es;
let activeLanguage: Language = 'es';

export function onLanguageChange(listener: (language: Language) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<Language>).detail);
  window.addEventListener('vbn:language-change', handler);
  return () => window.removeEventListener('vbn:language-change', handler);
}

export function translateCurrent(key: MessageKey, variables: Record<string, string | number> = {}): string {
  return translate(activeLanguage, key, variables);
}

export function translate(language: Language, key: MessageKey, variables: Record<string, string | number> = {}): string {
  const template = catalogs[language][key] ?? catalogs.es[key];
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(variables[name] ?? `{${name}}`));
}

export function setDocumentLanguage(language: Language): void {
  const changed = activeLanguage !== language;
  activeLanguage = language;
  document.documentElement.lang = language;
  if (changed) window.dispatchEvent(new CustomEvent('vbn:language-change', { detail: language }));
}
