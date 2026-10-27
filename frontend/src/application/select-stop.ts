import { getStopArrivals, pendingStopArrivals, startStopArrivalsRefresh, type StopArrivalsResult } from './get-stop-arrivals';
import type { ArrivalsCachePort, ArrivalsGateway, ClockPort, VisibilityPort } from './ports';
import { getFreshnessState } from '../domain/freshness';
import type { Stop } from '../domain/types';

export interface StopSelectionViewModel {
  selectedStopId?: string;
  stop?: Stop;
  arrivals?: StopArrivalsResult;
}

export interface StopSelectionDependencies {
  stops: Stop[];
  arrivals: ArrivalsGateway;
  clock: ClockPort;
  visibility: VisibilityPort;
  cache?: ArrivalsCachePort;
}

export interface StopSelection {
  selectStop(stopId: string): Promise<void>;
  refresh(): Promise<void>;
  clearSelection(): void;
  getSnapshot(): StopSelectionViewModel;
  subscribe(listener: (model: StopSelectionViewModel) => void): () => void;
  dispose(): void;
}

export function createStopSelection(dependencies: StopSelectionDependencies): StopSelection {
  let viewModel: StopSelectionViewModel = {};
  let requestToken = 0;
  let activeLoad: (() => Promise<StopArrivalsResult>) | undefined;
  let stopRefresh: (() => void) | undefined;
  let disposed = false;
  const listeners = new Set<(model: StopSelectionViewModel) => void>();

  const publish = () => {
    for (const listener of listeners) listener(viewModel);
  };

  const load = async (stop: Stop, token: number): Promise<StopArrivalsResult> => {
    const result = await getStopArrivals(stop, dependencies.arrivals, dependencies.clock, dependencies.cache);
    if (disposed || token !== requestToken) return result;
    const ageSeconds = result.fetchedAt ? Math.max(0, (dependencies.clock.now().getTime() - Date.parse(result.fetchedAt)) / 1_000) : undefined;
    const freshness = getFreshnessState(ageSeconds, result.dataStatus === 'stale', result.source !== 'unavailable');
    const arrivals: StopArrivalsResult = {
      ...result,
      ...(freshness === 'unavailable' && result.source === 'cached' ? { arrivals: [], source: 'unavailable' as const } : {}),
      dataStatus: result.dataStatus === 'offline'
        ? 'offline'
        : result.dataStatus === 'empty' && freshness === 'current' ? 'empty' : freshness
    };
    viewModel = { ...viewModel, arrivals };
    publish();
    return arrivals;
  };

  return {
    async selectStop(stopId) {
      const stop = dependencies.stops.find((candidate) => candidate.id === stopId);
      if (!stop || disposed) return;
      const token = ++requestToken;
      stopRefresh?.();
      stopRefresh = undefined;
      const loadSelected = () => load(stop, token);
      activeLoad = loadSelected;
      viewModel = { selectedStopId: stop.id, stop, arrivals: pendingStopArrivals(stop) };
      publish();
      await loadSelected();
      if (!disposed && token === requestToken) {
        stopRefresh = startStopArrivalsRefresh(loadSelected, dependencies.visibility);
      }
    },
    async refresh() {
      await activeLoad?.();
    },
    clearSelection() {
      if (disposed) return;
      requestToken += 1;
      stopRefresh?.();
      stopRefresh = undefined;
      activeLoad = undefined;
      viewModel = {};
      publish();
    },
    getSnapshot() {
      return viewModel;
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(viewModel);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      requestToken += 1;
      stopRefresh?.();
      stopRefresh = undefined;
      activeLoad = undefined;
      listeners.clear();
    }
  };
}