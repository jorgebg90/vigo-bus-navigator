import { getLineFrequency } from './application/get-line-frequency';
import { createStopSelection, type StopSelection } from './application/select-stop';
import { renderLineFrequency } from './ui/line/frequency-view';
import { renderLinesList } from './ui/line/lines-list';
import { renderStopSearch } from './ui/search/stop-search';
import { ApiScheduleRepository } from './infrastructure/schedule/api-schedule-repository';
import { SystemClock } from './infrastructure/system/clock';
import { DocumentVisibility } from './infrastructure/system/visibility';
import { HttpArrivalsGateway } from './infrastructure/arrivals/http-arrivals-gateway';
import { renderStopArrivals } from './ui/stop/stop-view';
import { getAppConfig } from './infrastructure/config';
import { LocalStorageAdapter } from './infrastructure/storage/local-storage-adapter';
import { createSettingsMenu } from './ui/settings/settings-menu';
import { mountOfflineStatus } from './ui/offline-status';
import { BrowserMapPort } from './infrastructure/map/map-port';
import { renderMap } from './ui/map/map-view';
import './ui/styles.css';
import { applyTheme } from './ui/theme';
import { renderFavorites } from './ui/home/favorites';
import { toggleFavoriteForTarget } from './application/toggle-favorite';
import { recordRecentView } from './domain/favorites';
import type { DayType, Favorite, Line, RecentView, Stop } from './domain/types';
import { onLanguageChange, setDocumentLanguage } from './i18n';
import { createShell, type Destination } from './ui/shell';
import { createStopChooser } from './ui/map/stop-chooser';
import { renderMapToolbar } from './ui/map/map-toolbar';
import type { StopMapPort } from './application/ports';
import { showStorageNotice } from './ui/settings/storage-notice';
import { renderMapAttribution } from './ui/privacy/privacy-view';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Missing app root');

const clock = new SystemClock();
const visibility = new DocumentVisibility();
const storage = new LocalStorageAdapter();
applyTheme();
setDocumentLanguage(storage.loadPreferences().language);
const shell = createShell(app);
const view = shell.main;
let mapCleanup: (() => void) | undefined;
let unsubscribeSelection: (() => void) | undefined;
let panelCloseListener: (() => void) | undefined;
let currentDestination: Destination = 'map';
let activePanelStopId: string | undefined;
let activePanelContent: HTMLElement | undefined;
let activeMap: StopMapPort | undefined;
let selection: StopSelection | undefined;
let lines: Line[] = [];
let stops: Stop[] = [];
let schedule: ApiScheduleRepository | undefined;
let renderCurrentDestination: (() => void) | undefined;
const settingsHost = document.createElement('div');
settingsHost.className = 'settings-host';
shell.header.querySelector('.settings-trigger')?.replaceWith(settingsHost);
createSettingsMenu(settingsHost, storage);
shell.onDestinationChange((destination) => {
  currentDestination = destination;
  renderCurrentDestination?.();
});
const shellRoot = app.querySelector<HTMLElement>('.app-shell');
if (!shellRoot) throw new Error('Missing app shell');
mountOfflineStatus(shellRoot);
let remountMap: (() => void) | undefined;
let mountedMapTheme: 'light' | 'dark' | undefined;
new MutationObserver(() => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  if (activeMap && theme !== mountedMapTheme) remountMap?.();
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
void bootstrap();
onLanguageChange(() => { void bootstrap(); });

async function bootstrap(): Promise<void> {
  unsubscribeSelection?.();
  selection?.dispose();
  selection = undefined;
  mapCleanup?.();
  mapCleanup = undefined;
  activeMap = undefined;
  shell.base.replaceChildren();
  panelCloseListener?.();
  panelCloseListener = undefined;

  const config = getAppConfig();
  if (config.profile === 'production' && navigator.serviceWorker) {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
    const serviceWorker = navigator.serviceWorker;
    await serviceWorker.ready;
    if (!serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
      });
    }
  }

  schedule = new ApiScheduleRepository(config.arrivalsBaseUrl);
  const arrivals = new HttpArrivalsGateway(config.arrivalsBaseUrl);
  [lines, stops] = await Promise.all([schedule.listLines(), schedule.listStops()]);
  selection = createStopSelection({ stops, arrivals, clock, visibility });
  unsubscribeSelection = selection.subscribe((model) => {
    if (model.selectedStopId) activeMap?.setSelectedStop(model.selectedStopId);
    else activeMap?.setSelectedStop(null);
    if (model.stop && model.arrivals && model.stop.id === activePanelStopId && activePanelContent) {
      const currentSelection = selection;
      renderStopArrivals(activePanelContent, model.arrivals, () => { void currentSelection?.refresh(); }, {
        saved: storage.loadFavorites().some((favorite) => favorite.type === 'stop' && favorite.targetId === model.stop?.id),
        onToggle: () => {
          toggleFavoriteForTarget(storage, { type: 'stop', targetId: model.stop!.id });
          notifyStorageFailure();
          refreshFavorites();
        }
      }, lines, new Map(lines.map((line) => [line.code, line.color])));
    }
  });

  const refreshFavorites = () => {
    if (currentDestination === 'saved') renderDestination();
  };
  const remember = (type: 'line' | 'stop', targetId: string) => {
    const preferences = storage.loadPreferences();
    storage.savePreferences({
      ...preferences,
      recentViews: recordRecentView(preferences.recentViews, { type, targetId }, clock.now())
    });
    refreshFavorites();
  };
  const notifyStorageFailure = () => {
    if (!storage.persisted) showStorageNotice(shellRoot!);
  };

  const selectStop = (stopId: string): void => {
    const stop = stops.find((candidate) => candidate.id === stopId);
    if (!stop || !selection) return;
    remember('stop', stop.id);
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    const content = document.createElement('div');
    activePanelStopId = stop.id;
    activePanelContent = content;
    shell.openPanel(stop.name, content, opener);
    void selection.selectStop(stop.id);
  };

  const showStopOnMap = (stopId: string): void => {
    const stop = stops.find((candidate) => candidate.id === stopId);
    if (!stop) return;
    if (stop.lat === null || stop.lon === null) {
      selectStop(stopId);
      return;
    }
    shell.navigate('map');
    activeMap?.focusStop(stopId);
    selectStop(stopId);
  };

  const openSavedItem = (item: Favorite | RecentView): void => {
    if (item.type === 'line') {
      const line = lines.find((candidate) => candidate.id === item.targetId);
      if (line) void showLine(line);
      return;
    }
    showStopOnMap(item.targetId);
  };

  function mountBaseMap(): void {
    const mapRoot = document.createElement('section');
    shell.base.append(mapRoot);
    const map = new BrowserMapPort();
    activeMap = map;
    mountedMapTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    mapCleanup = renderMap(mapRoot, map, stops, mountedMapTheme);
    map.onStopSelected(selectStop);
    const chooser = createStopChooser(mapRoot, { onSelect: selectStop, lines });
    renderMapToolbar(mapRoot, {
      map,
      stops,
      onStopsInView: (visibleStops, center, opener) => chooser.open(visibleStops, center, opener)
    });
    renderMapAttribution(mapRoot);
    const stopsInViewButton = mapRoot.querySelector<HTMLButtonElement>('[data-stops-in-view]');
    map.onChooserRequested((stopIds) => {
      if (stopsInViewButton) chooser.open(stops.filter((stop) => stopIds.includes(stop.id)), map.getMapCenter(), stopsInViewButton);
    });
    const unmount = mapCleanup;
    mapCleanup = () => { chooser.destroy(); unmount?.(); };
  }

  function renderDestination(): void {
    view.dataset.destination = currentDestination;
    if (!schedule || !selection) return;
    selection.clearSelection();
    activePanelStopId = undefined;
    activePanelContent = undefined;
    activeMap?.setSelectedStop(null);
    if (!activeMap) mountBaseMap();

    if (currentDestination === 'saved') {
      renderFavorites(view, storage.loadFavorites(), lines, stops, openSavedItem, {
        recentViews: storage.loadPreferences().recentViews,
        persisted: storage.persisted,
        onRemove: (favorite) => {
          toggleFavoriteForTarget(storage, { type: favorite.type, targetId: favorite.targetId });
          renderDestination();
        }
      });
      return;
    }
    if (currentDestination === 'map') return;
    if (currentDestination === 'search') {
      renderStopSearch(view, {
        stops,
        favoriteStopIds: storage.loadFavorites().filter((favorite) => favorite.type === 'stop').map((favorite) => favorite.targetId),
        onSelect: showStopOnMap,
        onFavoriteToggle: (stopId) => {
          toggleFavoriteForTarget(storage, { type: 'stop', targetId: stopId });
          notifyStorageFailure();
          refreshFavorites();
        }
      });
      return;
    }
    renderLinesList(view, lines, (line) => { void showLine(line); });
  }

  const clearSelectionOnPanelClose = () => {
    activePanelStopId = undefined;
    activePanelContent = undefined;
    selection?.clearSelection();
    activeMap?.setSelectedStop(null);
  };
  window.addEventListener('vbn:panel-close', clearSelectionOnPanelClose);
  panelCloseListener = () => window.removeEventListener('vbn:panel-close', clearSelectionOnPanelClose);

  renderCurrentDestination = renderDestination;
  remountMap = () => {
    mapCleanup?.();
    mapCleanup = undefined;
    activeMap = undefined;
    shell.base.replaceChildren();
    mountBaseMap();
  };
  renderDestination();

  async function showLine(line: Line, requestedDayType?: DayType): Promise<void> {
    if (!schedule) return;
    shell.navigate('lines');
    remember('line', line.id);
    const result = await getLineFrequency(line.id, schedule, clock, requestedDayType);
    renderLineFrequency(view, {
      lineCode: result.line.code,
      lineColor: result.line.color,
      timetable: result.timetable,
      patterns: result.patterns,
      lines,
      favoriteStopIds: storage.loadFavorites().filter((favorite) => favorite.type === 'stop').map((favorite) => favorite.targetId),
      dayType: result.dayType,
      onDayTypeChange: (dayType) => { void showLine(line, dayType); },
      onStopSelect: showStopOnMap,
      onStopFavoriteToggle: (stopId) => {
        toggleFavoriteForTarget(storage, { type: 'stop', targetId: stopId });
        notifyStorageFailure();
        refreshFavorites();
      }
    });
  }
}
