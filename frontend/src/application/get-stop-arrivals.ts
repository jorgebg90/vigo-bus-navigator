import type { Arrival, ArrivalReceipt, NetworkStop, Provenance } from '../domain/types';
import type {
  ClockPort,
  MunicipalArrivalCachePort,
  MunicipalArrivalsGateway,
  VisibilityPort
} from './ports';

export interface StopArrivalsResult {
  stop: NetworkStop;
  arrivals: Arrival[];
  source: 'live' | 'cached' | 'unavailable';
  dataStatus: 'loading' | 'current' | 'stale' | 'empty' | 'unavailable' | 'offline';
  fetchedAt: string;
  retryPending?: boolean;
  provenance?: Provenance;
  error?: string;
}

export function pendingStopArrivals(stop: NetworkStop): StopArrivalsResult {
  return { stop, arrivals: [], source: 'live', dataStatus: 'loading', fetchedAt: '' };
}

export function startStopArrivalsRefresh(
  load: () => Promise<StopArrivalsResult>,
  visibility: VisibilityPort,
  intervalMs = 30_000
): () => void {
  let timer: ReturnType<typeof setInterval> | undefined;
  const refresh = () => { if (visibility.visible) void load(); };
  const schedule = (visible: boolean) => {
    if (timer) clearInterval(timer);
    timer = visible ? setInterval(refresh, intervalMs) : undefined;
  };
  const unsubscribe = visibility.onVisibilityChange(schedule);
  schedule(visibility.visible);
  return () => { if (timer) clearInterval(timer); unsubscribe(); };
}

export async function getStopArrivals(
  stop: NetworkStop,
  arrivalsPort: MunicipalArrivalsGateway,
  clock: ClockPort,
  cache?: MunicipalArrivalCachePort
): Promise<StopArrivalsResult> {
  if (!stop.vitrasaId) {
    return {
      stop,
      arrivals: [],
      source: 'unavailable',
      dataStatus: 'unavailable',
      fetchedAt: clock.now().toISOString(),
      error: 'Live arrivals are unavailable for this stop'
    };
  }

  const response = await arrivalsPort.getArrivals(stop);
  if (response.kind === 'success') {
    const receipt = response.value;
    if (receipt.stopId !== stop.id || receipt.vitrasaId !== stop.vitrasaId) {
      return unavailable(stop, clock, 'Arrival identity could not be verified');
    }
    cache?.set(receipt);
    return {
      stop,
      arrivals: receipt.arrivals,
      source: 'live',
      dataStatus: receipt.arrivals.length ? 'current' : 'empty',
      fetchedAt: receipt.fetchedAt,
      provenance: receipt.provenance
    };
  }

  const cached = cache?.get(stop.id);
  if (response.reason === 'offline') {
    return {
      stop,
      arrivals: cached?.arrivals ?? [],
      source: cached ? 'cached' : 'unavailable',
      dataStatus: 'offline',
      fetchedAt: cached?.fetchedAt ?? clock.now().toISOString(),
      provenance: cached?.provenance,
      error: 'Offline'
    };
  }
  if (cached) {
    return {
      stop,
      arrivals: cached.arrivals,
      source: 'cached',
      dataStatus: 'stale',
      fetchedAt: cached.fetchedAt,
      provenance: cached.provenance,
      error: 'Live arrivals unavailable'
    };
  }
  return unavailable(stop, clock, 'Live arrivals unavailable');
}

function unavailable(stop: NetworkStop, clock: ClockPort, error: string): StopArrivalsResult {
  return {
    stop,
    arrivals: [],
    source: 'unavailable',
    dataStatus: 'unavailable',
    fetchedAt: clock.now().toISOString(),
    error
  };
}
