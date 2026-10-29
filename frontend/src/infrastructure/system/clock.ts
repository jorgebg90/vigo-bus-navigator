import type { ClockPort } from '../../application/ports';

export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }

  onDateChange(listener: () => void): () => void {
    const interval = window.setInterval(listener, 60_000);
    return () => window.clearInterval(interval);
  }
}
