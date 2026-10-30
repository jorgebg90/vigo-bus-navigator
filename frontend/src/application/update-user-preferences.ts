import { recordRecentView } from '../domain/favorites';
import type { Language, RecentView, UserPreferences } from '../domain/types';
import type { StoragePort } from './ports';

export function loadUserPreferences(storage: StoragePort): UserPreferences {
  const preferences = storage.loadPreferences();
  if (preferences.language !== 'en') return preferences;
  const normalized = { ...preferences, language: 'es' as const };
  storage.savePreferences(normalized);
  return normalized;
}

export function setPreferredLanguage(storage: StoragePort, language: Language): UserPreferences {
  const preferences = storage.loadPreferences();
  const updated = { ...preferences, language };
  storage.savePreferences(updated);
  return updated;
}

export function recordUserView(
  storage: StoragePort,
  view: Omit<RecentView, 'viewedAt'>,
  now: Date
): RecentView[] {
  const preferences = storage.loadPreferences();
  const recentViews = recordRecentView(preferences.recentViews, view, now);
  storage.savePreferences({ ...preferences, recentViews });
  return recentViews;
}
