import type { Favorite, Line, RecentView, Stop } from '../../domain/types';
import { translateCurrent } from '../../i18n';

export interface FavoritesViewOptions {
  recentViews?: RecentView[];
  persisted?: boolean;
}

export function renderFavorites(root: HTMLElement, favorites: Favorite[], lines: Line[], stops: Stop[], onSelect: (favorite: Favorite) => void, options: FavoritesViewOptions = {}): void {
  root.replaceChildren();
  if (options.persisted === false) {
    const notice = document.createElement('p');
    notice.setAttribute('role', 'status');
    notice.textContent = translateCurrent('storageUnavailable');
    root.append(notice);
  }
  const heading = document.createElement('h2');
  heading.textContent = translateCurrent('favorites');
  root.append(heading);
  const list = document.createElement('ul');
  for (const favorite of favorites) {
    const item = document.createElement('li');
    const entity = favorite.type === 'line' ? lines.find((line) => line.id === favorite.targetId) : stops.find((stop) => stop.id === favorite.targetId);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = entity ? `${favorite.type}: ${entity.name}` : favorite.targetId;
    button.addEventListener('click', () => onSelect(favorite));
    item.append(button);
    list.append(item);
  }
  root.append(list);
  if (options.recentViews?.length) {
    const recentHeading = document.createElement('h2');
    recentHeading.textContent = translateCurrent('recentViews');
    root.append(recentHeading);
    const recentList = document.createElement('ul');
    for (const recent of options.recentViews) {
      const entity = recent.type === 'line' ? lines.find((line) => line.id === recent.targetId) : stops.find((stop) => stop.id === recent.targetId);
      if (!entity) continue;
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${recent.type}: ${entity.name}`;
      button.addEventListener('click', () => onSelect({ type: recent.type, targetId: recent.targetId, order: -1 }));
      item.append(button);
      recentList.append(item);
    }
    root.append(recentList);
  }
}
