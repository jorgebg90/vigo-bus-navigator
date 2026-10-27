import type { Favorite, Line, RecentView, Stop } from '../../domain/types';
import { translateCurrent } from '../../i18n';
import { createStarIcon } from '../favorite-toggle';
import { createLineBadge } from '../line-badge';

export interface FavoritesViewOptions {
  recentViews?: RecentView[];
  persisted?: boolean;
  onRemove?: (favorite: Favorite) => void;
}

export function renderFavorites(root: HTMLElement, favorites: Favorite[], lines: Line[], stops: Stop[], onSelect: (item: Favorite | RecentView) => void, options: FavoritesViewOptions = {}): void {
  root.replaceChildren();
  if (options.persisted === false) {
    const notice = document.createElement('p');
    notice.setAttribute('role', 'status');
    notice.textContent = translateCurrent('storageUnavailable');
    root.append(notice);
  }
  const heading = document.createElement('h1');
  heading.textContent = translateCurrent('navSaved');
  root.append(heading);
  const tabs = document.createElement('div');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', translateCurrent('navSaved'));
  const panel = document.createElement('section');
  panel.setAttribute('role', 'tabpanel');
  let activeTab: 'favorites' | 'recent' = 'favorites';

  const renderTab = () => {
    tabs.replaceChildren();
    const favoritesTab = document.createElement('button');
    favoritesTab.type = 'button';
    favoritesTab.id = 'saved-favorites-tab';
    favoritesTab.setAttribute('role', 'tab');
    favoritesTab.setAttribute('aria-selected', String(activeTab === 'favorites'));
    favoritesTab.textContent = translateCurrent('savedFavorites');
    favoritesTab.addEventListener('click', () => { activeTab = 'favorites'; renderTab(); });
    const recentTab = document.createElement('button');
    recentTab.type = 'button';
    recentTab.id = 'saved-recent-tab';
    recentTab.setAttribute('role', 'tab');
    recentTab.setAttribute('aria-selected', String(activeTab === 'recent'));
    recentTab.textContent = translateCurrent('savedRecent');
    recentTab.addEventListener('click', () => { activeTab = 'recent'; renderTab(); });
    tabs.append(favoritesTab, recentTab);

    panel.setAttribute('aria-labelledby', activeTab === 'favorites' ? favoritesTab.id : recentTab.id);
    panel.replaceChildren();
    const list = document.createElement('ul');
    if (activeTab === 'favorites') {
      if (favorites.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = translateCurrent('savedEmpty');
        panel.append(empty);
      }
      for (const favorite of favorites) {
        const entity = stops.find((stop) => stop.id === favorite.targetId);
        const name = entity?.name ?? translateCurrent('unavailableFavorite', { name: favorite.targetId });
        const item = document.createElement('li');
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'stop-open';
        open.append(name);
        open.addEventListener('click', () => { if (entity) onSelect(favorite); });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'favorite-toggle';
        remove.dataset.action = 'remove';
        const removeLabel = translateCurrent('removeFavoriteNamed', { name });
        remove.setAttribute('aria-label', removeLabel);
        remove.title = removeLabel;
        remove.append(createStarIcon(true));
        remove.addEventListener('click', () => options.onRemove?.(favorite));
        item.append(remove);
        if (entity) {
          item.prepend(open);
        } else {
          const status = document.createElement('span');
          status.className = 'stop-open';
          status.textContent = name;
          item.prepend(status);
        }
        list.append(item);
      }
    } else {
      const recentViews = options.recentViews ?? [];
      if (recentViews.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = translateCurrent('recentEmpty');
        panel.append(empty);
      }
      for (const recent of recentViews) {
        const entity = recent.type === 'line' ? lines.find((line) => line.id === recent.targetId) : stops.find((stop) => stop.id === recent.targetId);
        if (!entity) continue;
        const item = document.createElement('li');
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'stop-open';
        if (recent.type === 'line') open.append(createLineBadge(entity as Line));
        open.append(entity.name);
        open.addEventListener('click', () => onSelect(recent));
        item.append(open);
        list.append(item);
      }
    }
    if (list.childElementCount) panel.append(list);
  };

  root.append(tabs, panel);
  renderTab();
}
