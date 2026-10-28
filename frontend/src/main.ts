import { createStopSelection, type StopSelection } from './application/select-stop';
import { RequestVersion } from './application/request-version';
import { getBundledScheduleFallback } from './application/get-bundled-schedule-fallback';
import { renderLineFrequency } from './ui/line/frequency-view';
import { renderLinesList } from './ui/line/lines-list';
import { renderStopSearch } from './ui/search/stop-search';
import { MunicipalScheduleRepository, type OnlineLineRoute } from './infrastructure/schedule/municipal-schedule-repository';
import { SystemClock } from './infrastructure/system/clock';
import { DocumentVisibility } from './infrastructure/system/visibility';
import { MunicipalArrivalsAdapter } from './infrastructure/municipal/arrivals-adapter';
import { MunicipalLineCatalogAdapter } from './infrastructure/municipal/line-catalog-adapter';
import { MunicipalServiceCatalogAdapter } from './infrastructure/municipal/service-catalog-adapter';
import { MunicipalStopDetailAdapter } from './infrastructure/municipal/stop-detail-adapter';
import { MunicipalServingLinesAdapter } from './infrastructure/municipal/serving-lines-adapter';
import { MunicipalLineScheduleAdapter } from './infrastructure/municipal/line-schedule-adapter';
import { MunicipalRouteShapeAdapter } from './infrastructure/municipal/route-shape-adapter';
import { MunicipalTripStopAdapter } from './infrastructure/municipal/trip-stop-adapter';
import { MunicipalLineStopAdapter } from './infrastructure/municipal/line-stop-adapter';
import { BundledDiscoveryCatalog } from './infrastructure/municipal/bundled-discovery-catalog';
import { OnlineStopCatalog } from './infrastructure/municipal/online-stop-catalog';
import { BundledScheduleSnapshotCatalog } from './infrastructure/schedule/bundled-schedule-snapshot';
import { MunicipalHttpClient } from './infrastructure/municipal/http-client';
import { createDefaultFixtureMunicipalClient } from './infrastructure/municipal/default-fixture-client';
import { ArrivalCache } from './infrastructure/municipal/arrival-cache';
import { renderStopArrivals } from './ui/stop/stop-view';
import { renderServingLines, renderServingLinesLoading } from './ui/stop/serving-lines-view';
import { getAppConfig, getMunicipalProfileConfig } from './infrastructure/config';
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
import { deriveDayType } from './domain/day-type';
import type { DayType, Favorite, Line, NetworkStop, Provenance, RecentView, SelectedLineRouteDisplay } from './domain/types';
import { onLanguageChange, setDocumentLanguage, translateCurrent } from './i18n';
import { createShell, type Destination } from './ui/shell';
import { createStopChooser } from './ui/map/stop-chooser';
import { renderMapToolbar } from './ui/map/map-toolbar';
import type { GeolocationPort, StopMapPort } from './application/ports';
import { showStorageNotice } from './ui/settings/storage-notice';
import { renderMapAttribution } from './ui/privacy/privacy-view';
import { BrowserGeolocation } from './infrastructure/system/browser-geolocation';
import { isValidCurrentLocation, isWithinMapCoverage } from './domain/map-stops';
import type { CurrentLocation, LocationRequestState } from './domain/types';
import { renderLocationStatus, type LocationStatusMessage } from './ui/map/location-status';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Missing app root');

const clock = new SystemClock();
const onlineCatalogEvidenceRef = 'official-app-online-catalog-2026-10-28';
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
const geolocation: GeolocationPort = new BrowserGeolocation();
let locationAttempted = false;
let locationState: LocationRequestState = 'not-requested';
let currentLocation: CurrentLocation | undefined;
let locationWasCentered = false;
let locationStatus: LocationStatusMessage | null = null;
let locationStatusRoot: HTMLElement | undefined;
let selectedLineRoute: SelectedLineRouteDisplay | null = null;
let selection: StopSelection | undefined;
let lines: Line[] = [];
let stops: NetworkStop[] = [];
let schedule: MunicipalScheduleRepository | undefined;
let discoveryProvenance: Provenance | undefined;
let lineCatalogUnavailable = false;
let activeServingLinesRequest = 0;
const lineViewRequests = new RequestVersion();
let renderCurrentDestination: (() => void) | undefined;
const settingsHost = document.createElement('div');
settingsHost.className = 'settings-host';
shell.header.querySelector('.settings-trigger')?.replaceWith(settingsHost);
createSettingsMenu(settingsHost, storage);
shell.onDestinationChange((destination) => {
  currentDestination = destination;
  if (destination !== 'lines') {
    lineViewRequests.invalidate();
    selectedLineRoute = null;
    activeMap?.setLineRoute(null);
  }
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
  lineViewRequests.invalidate();
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
  const municipalConfig = getMunicipalProfileConfig();
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

  const routeFixture = import.meta.env.MODE === 'test' && municipalConfig.profile === 'fixture'
    ? new URLSearchParams(window.location.search).get('routeFixture')
    : null;
  const municipalClient = municipalConfig.profile === 'fixture'
    ? createDefaultFixtureMunicipalClient(
        routeFixture === 'missing' || routeFixture === 'invalid' ? routeFixture : undefined
      )
    : new MunicipalHttpClient(municipalConfig.profile);
  const bundledDiscovery = new BundledDiscoveryCatalog();
  const isFixtureProfile = municipalConfig.profile === 'fixture';
  let snapshotEntries: readonly unknown[] = [];
  if (import.meta.env.MODE === 'test' && isFixtureProfile) {
    const snapshotFixtures = await import('../tests/fixtures/schedule-snapshots');
    snapshotEntries = new URLSearchParams(window.location.search).get('snapshotFixture') === 'untrusted'
      ? snapshotFixtures.untrustedBundledScheduleSnapshots
      : snapshotFixtures.bundledScheduleSnapshots;
  }
  const provisionalStopsByMunicipalCode: Record<string, NetworkStop> = {};
  const allowsScopedCandidateActions = municipalConfig.profile === 'local-live'
    || municipalConfig.profile === 'production';
  const usesOnlineCatalog = allowsScopedCandidateActions;
  schedule = new MunicipalScheduleRepository(
    new MunicipalLineCatalogAdapter(municipalClient, clock, municipalConfig.profile),
    new MunicipalServiceCatalogAdapter(municipalClient, clock, municipalConfig.profile),
    new MunicipalStopDetailAdapter(municipalClient, municipalConfig.profile),
    new MunicipalServingLinesAdapter(municipalClient, clock, municipalConfig.profile),
    new MunicipalLineScheduleAdapter(
      municipalClient,
      clock,
      municipalConfig.profile,
      isFixtureProfile
        ? {
            A: {
              scheduleId: 'A',
              evidenceRef: 'spec.md#FR-031',
              verification: 'provisional',
              dayCodes: { weekday: '1', saturday: '6', sunday_holiday: '0' }
            }
          }
        : {},
      usesOnlineCatalog ? { evidenceRef: onlineCatalogEvidenceRef } : undefined
    ),
    bundledDiscovery,
    new MunicipalRouteShapeAdapter(
      municipalClient,
      clock,
      municipalConfig.profile,
      isFixtureProfile
        ? {
            A: {
              shapeId: 'Route_1005',
              crs: 'OGC:CRS84',
              evidenceRef: 'spec.md#FR-025',
              verification: 'provisional'
            }
          }
        : {}
    ),
    new MunicipalTripStopAdapter(
      municipalClient,
      clock,
      municipalConfig.profile,
      isFixtureProfile
        ? (['weekday', 'saturday', 'sunday_holiday'] as const).map((dayType) => ({
            lineCode: 'A',
            lineId: 'line-a',
            dayType,
            tripId: 'A  02LP000_008002_4',
            evidenceRef: 'spec.md#FR-032',
            stopsByMunicipalCode: provisionalStopsByMunicipalCode,
            verification: 'provisional' as const
          }))
        : []
    ),
    new MunicipalLineStopAdapter(
      municipalClient,
      clock,
      municipalConfig.profile,
      isFixtureProfile
        ? {
            '2789:A': {
              min: 0,
              expectedTripIdPrefix: 'A',
              evidenceRef: 'spec.md#FR-026',
              verification: 'provisional'
            }
          }
        : allowsScopedCandidateActions
          ? {
              '2789:A': {
                min: 0,
                expectedTripIdPrefix: 'A',
                evidenceRef: 'stakeholder-postman-validation-2026-10-28',
                verification: 'stakeholder-attested'
              }
            }
          : {}
    ),
    new BundledScheduleSnapshotCatalog(snapshotEntries),
    usesOnlineCatalog
      ? { stopCatalog: new OnlineStopCatalog(municipalClient, clock), evidenceRef: onlineCatalogEvidenceRef }
      : undefined
  );
  const arrivals = new MunicipalArrivalsAdapter(municipalClient, clock, municipalConfig.profile);
  const arrivalCache = new ArrivalCache(() => clock.now().getTime());
  const [lineCatalogResult, discovery] = await Promise.all([
    schedule.getMunicipalLineCatalog(storage.loadPreferences().language),
    schedule.getStopDiscoveryCatalog()
  ]);
  stops = discovery.stops;
  discoveryProvenance = discovery.provenance;
  lineCatalogUnavailable = lineCatalogResult.kind === 'unavailable';
  lines = lineCatalogResult.kind === 'success'
    ? lineCatalogResult.value.lines.map((line) => ({
        id: line.id,
        code: line.code,
        name: line.name,
        color: line.color
      }))
    : [];
  selection = createStopSelection({ stops, arrivals, clock, visibility, cache: arrivalCache });
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
    const activeElement = document.activeElement;
    const opener = activeElement instanceof HTMLElement && activeElement !== document.body ? activeElement : undefined;
    const content = document.createElement('div');
    const arrivalsContent = document.createElement('div');
    arrivalsContent.dataset.stopArrivals = 'true';
    const servingLinesContent = document.createElement('section');
    servingLinesContent.dataset.stopServingLines = 'true';
    content.append(arrivalsContent, servingLinesContent);
    activePanelStopId = stop.id;
    activePanelContent = arrivalsContent;
    shell.openPanel(stop.name, content, opener);
    void selection.selectStop(stop.id);
    const requestId = ++activeServingLinesRequest;
    renderServingLinesLoading(servingLinesContent);
    void schedule?.getMunicipalServingLines(stop).then(async (result) => {
      if (requestId !== activeServingLinesRequest || activePanelStopId !== stop.id) return;
      const lineStopResults = result.kind === 'success'
        ? await Promise.all(result.value.lines.map((line) => schedule!.getLineStopDetail(stop, line.code)))
        : [];
      if (requestId !== activeServingLinesRequest || activePanelStopId !== stop.id) return;
      const provisionalDetails = lineStopResults
        .filter((detail) => detail.kind === 'success')
        .map((detail) => detail.value);
      renderServingLines(servingLinesContent, result, (lineCode) => {
        const line = lines.find((candidate) => candidate.code === lineCode);
        if (line) void showLine(line);
      }, provisionalDetails);
    });
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
    locationStatusRoot = document.createElement('div');
    locationStatusRoot.className = 'location-status-host';
    mapRoot.append(locationStatusRoot);
    renderLocationStatus(locationStatusRoot, locationStatus);
    map.setLineRoute(selectedLineRoute);
    map.onStopSelected(selectStop);
    const chooser = createStopChooser(mapRoot, { onSelect: selectStop, lines });
    renderMapToolbar(mapRoot, {
      map,
      onRecenter: () => {
        if (locationState === 'located') {
          locationStatus = map.getStopsInView(stops).length === 0 ? 'no-nearby-stops' : null;
          updateLocationStatus(map, locationStatusRoot);
        }
      }
    });
    renderMapAttribution(mapRoot);
    const recenterButton = mapRoot.querySelector<HTMLButtonElement>('[data-recenter]');
    map.onChooserRequested((stopIds) => {
      if (recenterButton) chooser.open(stops.filter((stop) => stopIds.includes(stop.id)), map.getMapCenter(), recenterButton);
    });
    const unmount = mapCleanup;
    mapCleanup = () => { chooser.destroy(); unmount?.(); };

    if (currentLocation) void map.showLocation(currentLocation, false);
    if (!locationAttempted && currentDestination === 'map' && isMobileViewport()) {
      locationAttempted = true;
      locationState = 'requesting';
      void geolocation.getCurrentPosition().then(async (result) => {
        if (result.kind !== 'success' || !isValidCurrentLocation(result.location)) {
          locationState = 'unavailable';
          locationStatus = 'unavailable';
          map.clearLocation();
          updateLocationStatus(map, locationStatusRoot);
          return;
        }
        if (!isWithinMapCoverage(result.location)) {
          locationState = 'outside-coverage';
          currentLocation = undefined;
          locationStatus = 'outside-coverage';
          map.clearLocation();
          updateLocationStatus(map, locationStatusRoot);
          return;
        }
        currentLocation = result.location;
        locationState = 'located';
        const targetMap = activeMap;
        if (!targetMap) return;
        const displayResult = await targetMap.showLocation(result.location, targetMap === map && currentDestination === 'map');
        if (activeMap !== targetMap) return;
        locationWasCentered = displayResult.cameraCentered;
        locationStatus = currentDestination === 'map' && displayResult.cameraCentered && !displayResult.hasVisibleStops
          ? 'no-nearby-stops'
          : null;
        updateLocationStatus(targetMap, locationStatusRoot);
      }).catch((error: unknown) => {
        locationState = 'unavailable';
        locationStatus = 'unavailable';
        map.clearLocation();
        updateLocationStatus(map, locationStatusRoot);
        console.error('Could not access the current location.', error);
      });
    }
  }

  function isMobileViewport(): boolean {
    return globalThis.matchMedia?.('(max-width: 599px)').matches ?? false;
  }

  function updateLocationStatus(map: StopMapPort, root: HTMLElement | undefined): void {
    if (activeMap === map && currentDestination === 'map' && root?.isConnected) {
      renderLocationStatus(root, locationStatus);
    }
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
    if (currentDestination === 'map') {
      if (locationState === 'located' && locationWasCentered && !locationStatus && activeMap?.getStopsInView(stops).length === 0) {
        locationStatus = 'no-nearby-stops';
      }
      if (locationStatusRoot) renderLocationStatus(locationStatusRoot, locationStatus);
      return;
    }
    if (currentDestination === 'search') {
      renderStopSearch(view, {
        stops,
        discoveryProvenance,
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
    renderLinesList(view, lines, (line) => { void showLine(line); }, {
      unavailable: lineCatalogUnavailable
    });
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
    const repository = schedule;
    if (!repository) return;
    if (currentDestination !== 'lines') shell.navigate('lines');
    selectedLineRoute = null;
    activeMap?.setLineRoute(null);
    remember('line', line.id);
    const dayType = requestedDayType ?? deriveDayType(clock.now(), []);
    const requestVersion = lineViewRequests.next();
    const [scheduleResult, patterns, routeShapeResult, tripStopsResult] = await Promise.all([
      navigator.onLine
        ? repository.getPublishedLineSchedule(line.code, dayType)
        : Promise.resolve({ kind: 'unavailable' as const, reason: 'offline' as const }),
      repository.getRoutePatterns(line.id),
      repository.getRouteShape(line.code),
      repository.getTripStops(line.code, dayType)
    ]);
    if (!lineViewRequests.isCurrent(requestVersion) || currentDestination !== 'lines') return;
    const snapshotFallback = await getBundledScheduleFallback(
      repository,
      line,
      dayType,
      patterns,
      navigator.onLine,
      scheduleResult
    );
    if (!lineViewRequests.isCurrent(requestVersion) || currentDestination !== 'lines') return;
    const publishedSchedule = scheduleResult.kind === 'success' ? scheduleResult.value : undefined;
    const getSelectedRoute = (onlineRoute?: OnlineLineRoute): SelectedLineRouteDisplay | null => {
      if (onlineRoute?.directionalRoutes?.length) {
        return { lineId: line.id, lineCode: line.code, directions: onlineRoute.directionalRoutes };
      }
      if (routeShapeResult.kind !== 'success') return null;
      return {
        lineId: line.id,
        lineCode: line.code,
        directions: [{
          direction: 0,
          headsign: translateCurrent('lineMapDefaultDirection'),
          shapeId: routeShapeResult.value.shapeId,
          geometry: routeShapeResult.value.geometry
        }]
      };
    };
    const render = (onlineRoute?: OnlineLineRoute, routeLoaded = false) => {
      const mapRoute = getSelectedRoute(onlineRoute);
      if (routeLoaded || mapRoute) {
        selectedLineRoute = mapRoute;
        activeMap?.setLineRoute(mapRoute);
      }
      renderLineFrequency(view, {
      lineCode: line.code,
      lineColor: line.color,
      publishedSchedule,
      bundledScheduleSnapshots: snapshotFallback.snapshots,
      snapshotFallbackAttempted: snapshotFallback.attempted,
      mapRoute: mapRoute ?? undefined,
      mapRouteUnavailable: routeLoaded && !mapRoute,
      routeShape: onlineRoute?.routeShape
        ?? (routeShapeResult.kind === 'success' ? routeShapeResult.value : undefined),
      tripStops: tripStopsResult.kind === 'success' ? tripStopsResult.value : undefined,
      scheduleUnavailableReason: scheduleResult.kind === 'unavailable' ? scheduleResult.reason : undefined,
      patterns: onlineRoute?.patterns.length ? onlineRoute.patterns : patterns,
      routeProvenance: onlineRoute?.patterns.length ? onlineRoute.provenance : discoveryProvenance,
      lines,
      favoriteStopIds: storage.loadFavorites().filter((favorite) => favorite.type === 'stop').map((favorite) => favorite.targetId),
      dayType,
      onDayTypeChange: (dayType) => { void showLine(line, dayType); },
      onStopSelect: showStopOnMap,
      onStopFavoriteToggle: (stopId) => {
        toggleFavoriteForTarget(storage, { type: 'stop', targetId: stopId });
        notifyStorageFailure();
        refreshFavorites();
      }
      });
    };
    const hasOnlineTrips = Boolean(publishedSchedule?.trips?.length);
    render(undefined, !hasOnlineTrips);
    if (!hasOnlineTrips || !publishedSchedule) return;
    const onlineRoute = await repository.getOnlineLineRoute(publishedSchedule);
    if (!lineViewRequests.isCurrent(requestVersion) || currentDestination !== 'lines') return;
    render(onlineRoute, true);
  }
}
