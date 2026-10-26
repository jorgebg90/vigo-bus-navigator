import { describe, expect, it } from 'vitest';
import { recordRecentView, toggleFavorite } from '../../src/domain/favorites';
import type { RecentView } from '../../src/domain/types';

describe('favorites', () => {
  it('toggles targets and retains recent views newest first', () => {
    const favorite = { type: 'line' as const, targetId: 'l4a' };
    expect(toggleFavorite([], favorite)[0].targetId).toBe('l4a');
    expect(toggleFavorite([{ ...favorite, order: 0 }], favorite)).toEqual([]);
    const views = Array.from({ length: 6 }, (_, index) => ({ type: 'line' as const, targetId: String(index) }));
    expect(views.reduce<RecentView[]>((list, view) => recordRecentView(list, view, new Date(indexDate(view.targetId))), [])).toHaveLength(5);
  });
});
function indexDate(index: string): string { return `2026-01-0${Number(index) + 1}T00:00:00Z`; }
