import type { MunicipalFailureReason } from './municipal-failures';
import { isReceiptTimestampConsistent } from './municipal-contract';
import type { ArrivalReceipt } from './types';

export type ArrivalViewStatus = 'loading' | 'current' | 'empty' | 'refreshing' | 'stale' | 'unavailable';

export interface ArrivalView {
  status: ArrivalViewStatus;
  ageSeconds: number | null;
  refreshFailed: boolean;
  online: boolean;
  receipt: ArrivalReceipt | null;
  reason?: MunicipalFailureReason;
}

export function deriveArrivalView(
  receipt: ArrivalReceipt | null,
  now: Date,
  options: {
    loading?: boolean;
    refreshing: boolean;
    refreshFailed: boolean;
    online: boolean;
    failureReason?: MunicipalFailureReason;
  }
): ArrivalView {
  const reason = !options.online ? 'offline' : options.failureReason;
  if (!receipt) {
    return {
      status: options.loading ? 'loading' : 'unavailable',
      ageSeconds: null,
      refreshFailed: options.refreshFailed,
      online: options.online,
      receipt: null,
      ...(reason ? { reason } : {})
    };
  }

  const nowMs = now.getTime();
  const fetchedAtMs = Date.parse(receipt.fetchedAt);
  const ageMs = nowMs - fetchedAtMs;
  if (
    !Number.isFinite(nowMs)
    || !Number.isFinite(fetchedAtMs)
    || ageMs < 0
    || !isReceiptTimestampConsistent(receipt)
  ) {
    return {
      status: 'unavailable',
      ageSeconds: null,
      refreshFailed: options.refreshFailed,
      online: options.online,
      receipt: null,
      reason: options.online ? 'invalid' : 'offline'
    };
  }

  const ageSeconds = ageMs / 1000;
  if (ageMs >= 300_000) {
    return {
      status: 'unavailable',
      ageSeconds,
      refreshFailed: options.refreshFailed,
      online: options.online,
      receipt: null,
      ...(reason ? { reason } : {})
    };
  }

  let status: ArrivalViewStatus;
  if (ageMs < 30_000) {
    status = receipt.arrivals.length === 0 ? 'empty' : 'current';
  } else if (options.refreshFailed) {
    status = 'stale';
  } else if (options.refreshing) {
    status = 'refreshing';
  } else {
    status = receipt.arrivals.length === 0 ? 'empty' : 'current';
  }

  return {
    status,
    ageSeconds,
    refreshFailed: options.refreshFailed,
    online: options.online,
    receipt,
    ...(reason ? { reason } : {})
  };
}
