import type { Arrival, Stop } from '../domain/types';
import type { ArrivalsCachePort, ArrivalsGateway, ClockPort, VisibilityPort } from './ports';

export interface StopArrivalsResult {
  stop: Stop;
  arrivals: Arrival[];
  source: 'live' | 'cached' | 'unavailable';
  dataStatus: 'loading' | 'current' | 'stale' | 'empty' | 'unavailable' | 'offline';
  fetchedAt: string;
  error?: string;
}

export function pendingStopArrivals(stop: Stop): StopArrivalsResult {
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
  stop: Stop,
  arrivalsPort: ArrivalsGateway,
  clock: ClockPort,
  cache?: ArrivalsCachePort
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

  try {
    const response = await arrivalsPort.getArrivals(stop.vitrasaId);
    if (response.kind !== 'live') {
      if (response.reason === 'offline') {
        const cached = cache?.get(stop.id);
        return {
          stop,
          arrivals: cached?.arrivals ?? [],
          source: cached ? 'cached' : 'unavailable',
          dataStatus: 'offline',
          fetchedAt: cached?.fetchedAt ?? clock.now().toISOString(),
          error: 'Offline'
        };
      }
      throw new Error(response.reason);
    }
    const fetchedAt = response.fetchedAt;
    cache?.set(stop.id, { arrivals: response.arrivals, fetchedAt: response.fetchedAt });
    return { stop, arrivals: response.arrivals, source: 'live', dataStatus: response.dataStatus, fetchedAt };
  } catch (error) {
    const cached = cache?.get(stop.id);
    if (cached) return { stop, arrivals: cached.arrivals, source: 'cached', dataStatus: 'stale', fetchedAt: cached.fetchedAt, error: 'Live arrivals unavailable' };
    return { stop, arrivals: [], source: 'unavailable', dataStatus: 'unavailable', fetchedAt: clock.now().toISOString(), error: 'Live arrivals unavailable' };
  }
}
