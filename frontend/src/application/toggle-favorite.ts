import { toggleFavorite } from '../domain/favorites';
import type { Favorite } from '../domain/types';
import type { StoragePort } from './ports';

export function loadUserFavorites(storage: StoragePort): Favorite[] {
  return storage.loadFavorites();
}

export function toggleFavoriteForTarget(storage: StoragePort, favorite: Omit<Favorite, 'order'>): Favorite[] {
  const next = toggleFavorite(storage.loadFavorites(), favorite);
  storage.saveFavorites(next);
  return next;
}
