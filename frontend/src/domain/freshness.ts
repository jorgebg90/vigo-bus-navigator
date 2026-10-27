import type { Arrival } from './types';

export type FreshnessState = 'current' | 'stale' | 'unavailable';

export function getFreshnessState(
  ageSeconds: number | undefined,
  upstreamFailed: boolean,
  hasResult: boolean
): FreshnessState {
  if (!hasResult || ageSeconds === undefined || !Number.isFinite(ageSeconds) || ageSeconds >= 300) {
    return 'unavailable';
  }
  if (upstreamFailed && ageSeconds >= 30) return 'stale';
  return 'current';
}

export function shouldAnnounceLoading(elapsedMs: number, alreadyAnnounced: boolean): boolean {
  return !alreadyAnnounced && elapsedMs >= 3_000;
}

export function firstArrivalChanged(previous: Arrival[], next: Arrival[]): boolean {
  const first = (arrivals: Arrival[]) => {
    const arrival = arrivals[0];
    return arrival && `${arrival.lineCode}\u0000${arrival.destination}\u0000${arrival.minutes}\u0000${arrival.eta}`;
  };
  return first(previous) !== first(next);
}