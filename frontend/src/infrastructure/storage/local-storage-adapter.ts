import type { Favorite, UserPreferences } from '../../domain/types';
import { defaultPreferences } from '../../domain/favorites';
import type { StoragePort } from '../../application/ports';

const legacyPrefix = 'vbn:v1:';
const currentPrefix = 'vbn:v2:';
const favoritesKey = 'favorites';
interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
interface Envelope<T> { v: number; data: T; }

export class LocalStorageAdapter implements StoragePort {
  private readonly memory = new Map<string, unknown>();
  private _persisted = true;

  constructor(private readonly storage: StorageLike | undefined = globalThis.localStorage) {}

  get persisted(): boolean { return this._persisted; }

  loadFavorites(): Favorite[] {
    const currentRaw = this.readRaw(currentPrefix + favoritesKey);
    if (currentRaw !== null) {
      const current = decodeFavorites(currentRaw, 2);
      this.memory.set(favoritesKey, current.favorites);
      return current.favorites;
    }

    const legacyRaw = this.readRaw(legacyPrefix + favoritesKey);
    if (legacyRaw === null) return this.memory.get(favoritesKey) as Favorite[] | undefined ?? [];

    const legacy = decodeFavorites(legacyRaw, 1);
    this.memory.set(favoritesKey, legacy.favorites);
    if (legacy.valid) this.writeFavorites(legacy.favorites);
    else if (legacy.parseFailed) this.preserveCorrupt(legacyPrefix + favoritesKey, legacyRaw);
    return legacy.favorites;
  }
  saveFavorites(favorites: Favorite[]): void { this.writeFavorites(favorites); }
  loadPreferences(): UserPreferences {
    const preferences = this.read<UserPreferences>('preferences') ?? defaultPreferences();
    if (preferences.theme !== 'light') {
      const lightPreferences = { ...preferences, theme: 'light' as const };
      this.write('preferences', lightPreferences);
      return lightPreferences;
    }
    return preferences;
  }
  savePreferences(preferences: UserPreferences): void { this.write('preferences', preferences); }

  private read<T>(key: string): T | undefined {
    try {
      const value = this.storage?.getItem(legacyPrefix + key);
      if (!value) return this.memory.get(key) as T | undefined;
      const parsed = JSON.parse(value) as Envelope<T>;
      if (parsed.v !== 1 || !('data' in parsed)) throw new Error('Invalid storage envelope');
      return parsed.data;
    } catch {
      try {
        const value = this.storage?.getItem(legacyPrefix + key);
        if (value) this.storage?.setItem(`${legacyPrefix}${key}.corrupt`, value);
      } catch { this._persisted = false; }
      return this.memory.get(key) as T | undefined;
    }
  }

  private write(key: string, value: unknown): void {
    try { this.storage?.setItem(legacyPrefix + key, JSON.stringify({ v: 1, data: value })); }
    catch { this._persisted = false; this.memory.set(key, value); }
  }

  private readRaw(key: string): string | null {
    try {
      return this.storage?.getItem(key) ?? null;
    } catch {
      this._persisted = false;
      return null;
    }
  }

  private writeFavorites(favorites: Favorite[]): void {
    this.memory.set(favoritesKey, favorites);
    try {
      if (!this.storage) throw new Error('Browser storage is unavailable');
      this.storage.setItem(currentPrefix + favoritesKey, JSON.stringify({ v: 2, data: favorites }));
    } catch {
      this._persisted = false;
    }
  }

  private preserveCorrupt(key: string, raw: string): void {
    try {
      this.storage?.setItem(`${key}.corrupt`, raw);
    } catch {
      this._persisted = false;
    }
  }
}

function decodeFavorites(raw: string, version: 1 | 2): { favorites: Favorite[]; valid: boolean; parseFailed?: boolean } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { favorites: [], valid: false, parseFailed: true };
  }

  if (typeof parsed !== 'object' || parsed === null || !('data' in parsed) || !Array.isArray(parsed.data)) {
    return { favorites: [], valid: false };
  }

  const rawFavorites = parsed.data as unknown[];
  const favorites = rawFavorites.filter(isFavorite);
  const unique = new Set(favorites.map((favorite) => `${favorite.type}\u0000${favorite.targetId}`));
  const valid = 'v' in parsed
    && parsed.v === version
    && favorites.length === rawFavorites.length
    && unique.size === favorites.length;
  return { favorites, valid };
}

function isFavorite(value: unknown): value is Favorite {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  const keys = Object.keys(item).sort();
  return keys.length === 3
    && keys[0] === 'order'
    && keys[1] === 'targetId'
    && keys[2] === 'type'
    && (item.type === 'stop' || item.type === 'line')
    && typeof item.targetId === 'string'
    && item.targetId.trim().length > 0
    && !/[\u0000-\u001f\u007f]/.test(item.targetId)
    && Number.isSafeInteger(item.order)
    && (item.order as number) >= 0;
}
