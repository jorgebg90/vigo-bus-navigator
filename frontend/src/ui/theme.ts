import type { Theme } from '../domain/types';

export function resolveTheme(theme: Theme, prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false): 'light' | 'dark' {
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = resolveTheme(theme);
}
