import type { Favorite, RecentView, UserPreferences } from './types';

export const defaultPreferences = (): UserPreferences => ({ theme: 'system', language: 'es', recentViews: [] });

export function toggleFavorite(favorites: Favorite[], favorite: Omit<Favorite, 'order'>): Favorite[] {
  const exists = favorites.some((item) => item.type === favorite.type && item.targetId === favorite.targetId);
  if (exists) return favorites.filter((item) => !(item.type === favorite.type && item.targetId === favorite.targetId)).map((item, order) => ({ ...item, order }));
  return [...favorites, { ...favorite, order: favorites.length }];
}

export function recordRecentView(recentViews: RecentView[], view: Omit<RecentView, 'viewedAt'>, now: Date): RecentView[] {
  return [{ ...view, viewedAt: now.toISOString() }, ...recentViews.filter((item) => !(item.type === view.type && item.targetId === view.targetId))].slice(0, 5);
}
