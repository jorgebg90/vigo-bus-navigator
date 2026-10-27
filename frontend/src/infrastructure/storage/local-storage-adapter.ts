import type { Favorite, UserPreferences } from '../../domain/types';
import { defaultPreferences } from '../../domain/favorites';
import type { StoragePort } from '../../application/ports';

const prefix = 'vbn:v1:';
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
    const stored = this.read<unknown>('favorites');
    if (!Array.isArray(stored)) return [];
    const favorites = stored.filter((item): item is Favorite =>
      typeof item === 'object' && item !== null && 'type' in item && item.type === 'stop'
      && 'targetId' in item && typeof item.targetId === 'string'
      && 'order' in item && typeof item.order === 'number'
    );
    if (favorites.length !== stored.length) this.write('favorites', favorites);
    return favorites;
  }
  saveFavorites(favorites: Favorite[]): void { this.write('favorites', favorites); }
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
      const value = this.storage?.getItem(prefix + key);
      if (!value) return this.memory.get(key) as T | undefined;
      const parsed = JSON.parse(value) as Envelope<T>;
      if (parsed.v !== 1 || !('data' in parsed)) throw new Error('Invalid storage envelope');
      return parsed.data;
    } catch {
      try {
        const value = this.storage?.getItem(prefix + key);
        if (value) this.storage?.setItem(`${prefix}${key}.corrupt`, value);
      } catch { this._persisted = false; }
      return this.memory.get(key) as T | undefined;
    }
  }

  private write(key: string, value: unknown): void {
    try { this.storage?.setItem(prefix + key, JSON.stringify({ v: 1, data: value })); }
    catch { this._persisted = false; this.memory.set(key, value); }
  }
}
