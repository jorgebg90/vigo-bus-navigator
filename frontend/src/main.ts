import { getLineFrequency } from './application/get-line-frequency';
import { renderLineCatalog } from './ui/home/line-catalog';
import { renderLineFrequency } from './ui/line/frequency-view';
import { ApiScheduleRepository } from './infrastructure/schedule/api-schedule-repository';
import { SystemClock } from './infrastructure/system/clock';
import { DocumentVisibility } from './infrastructure/system/visibility';
import { HttpArrivalsGateway } from './infrastructure/arrivals/http-arrivals-gateway';
import { getStopArrivals, pendingStopArrivals, startStopArrivalsRefresh } from './application/get-stop-arrivals';
import { renderStopArrivals } from './ui/stop/stop-view';
import { getAppConfig } from './infrastructure/config';
import { LocalStorageAdapter } from './infrastructure/storage/local-storage-adapter';
import { renderLanguageSettings } from './ui/settings/language-settings';
import { mountOfflineStatus } from './ui/offline-status';
import { BrowserMapPort } from './infrastructure/map/map-port';
import { renderMap } from './ui/map/map-view';
import './ui/styles.css';
import { applyTheme } from './ui/theme';
import { renderFavorites } from './ui/home/favorites';
import { toggleFavoriteForTarget } from './application/toggle-favorite';
import { recordRecentView } from './domain/favorites';
import type { DayType, Line } from './domain/types';
import { onLanguageChange } from './i18n';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Missing app root');

const clock = new SystemClock();
const visibility = new DocumentVisibility();
const storage = new LocalStorageAdapter();
let stopRefreshCleanup: (() => void) | undefined;
let activeStopId: string | undefined;
applyTheme(storage.loadPreferences().theme);
const shell = document.createElement('div');
shell.className = 'app-shell';
const view = document.createElement('main');
view.className = 'app-view';
const settings = document.createElement('aside');
const favorites = document.createElement('section');
const sidebar = document.createElement('aside');
sidebar.className = 'app-sidebar';
sidebar.append(settings, favorites);
shell.append(sidebar, view);
app.replaceChildren(shell);
mountOfflineStatus(shell);
void bootstrap();
onLanguageChange(() => { void bootstrap(); });

async function bootstrap(): Promise<void> {
  stopRefreshCleanup?.();
  stopRefreshCleanup = undefined;
  activeStopId = undefined;
  const config = getAppConfig();
  if (config.profile === 'production' && 'serviceWorker' in navigator) {
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
  const schedule = new ApiScheduleRepository(config.arrivalsBaseUrl);
  const [lines, stops] = await Promise.all([schedule.listLines(), schedule.listStops()]);
  const arrivals = new HttpArrivalsGateway(config.arrivalsBaseUrl);

  const refreshFavorites = () => renderFavorites(
    favorites,
    storage.loadFavorites(),
    lines,
    stops,
    openFavorite,
    { recentViews: storage.loadPreferences().recentViews, persisted: storage.persisted }
  );
  const remember = (type: 'line' | 'stop', targetId: string) => {
    const preferences = storage.loadPreferences();
    storage.savePreferences({ ...preferences, recentViews: recordRecentView(preferences.recentViews, { type, targetId }, clock.now()) });
    refreshFavorites();
  };
  const showStop = async (stopId: string): Promise<void> => {
    const stop = stops.find((candidate) => candidate.id === stopId);
    if (!stop) return;
    stopRefreshCleanup?.();
    stopRefreshCleanup = undefined;
    activeStopId = stop.id;
    remember('stop', stop.id);
    const load = async () => {
      renderStopArrivals(view, pendingStopArrivals(stop));
      const result = await getStopArrivals(stop, arrivals, clock);
      if (activeStopId === stop.id) renderStopArrivals(view, result, () => { void load(); });
      return result;
    };
    await load();
    stopRefreshCleanup = startStopArrivalsRefresh(load, visibility);
  };
  function openFavorite(favorite: { type: 'line' | 'stop'; targetId: string }): void {
    if (favorite.type === 'line') {
      const line = lines.find((candidate) => candidate.id === favorite.targetId);
      if (line) void showLine(line);
    } else {
      void showStop(favorite.targetId);
    }
  }

  renderLanguageSettings(settings, storage);
  refreshFavorites();
  renderLineCatalog(view, {
    lines,
    onSelect: (line) => { void showLine(line); }
  });

  async function showLine(line: Line, requestedDayType?: DayType): Promise<void> {
      stopRefreshCleanup?.();
      stopRefreshCleanup = undefined;
      activeStopId = undefined;
      remember('line', line.id);
      const result = await getLineFrequency(line.id, schedule, clock, requestedDayType);
      renderLineFrequency(view, {
        lineCode: result.line.code,
        timetable: result.timetable,
        dayType: result.dayType,
        datasetVersion: result.datasetVersion,
        onDayTypeChange: (dayType) => { void showLine(line, dayType); },
        onFavoriteToggle: () => {
          toggleFavoriteForTarget(storage, { type: 'line', targetId: line.id });
          refreshFavorites();
        },
        onStopSelect: showStop
      });
      if (!result.timetable) return;
      const mapRoot = document.createElement('section');
      view.append(mapRoot);
      const stopIds = result.timetable.byDayType[result.dayType]?.stopIds ?? [];
      renderMap(mapRoot, new BrowserMapPort(), stops.filter((stop) => stopIds.includes(stop.id)), 'light');
  }
}
