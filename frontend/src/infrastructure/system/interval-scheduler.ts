import type { IntervalPort } from '../../application/ports';

export class SystemIntervalScheduler implements IntervalPort {
  start(callback: () => void, intervalMs: number): () => void {
    const timer = globalThis.setInterval(callback, intervalMs);
    return () => globalThis.clearInterval(timer);
  }
}
