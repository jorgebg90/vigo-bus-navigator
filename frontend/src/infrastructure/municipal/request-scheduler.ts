interface ScheduledRequest {
  key: string;
  controller: AbortController;
  signal?: AbortSignal;
  abortListener?: () => void;
  cancelled: boolean;
  started: boolean;
  execute(): void;
}

export class RequestScheduler {
  private readonly queue: ScheduledRequest[] = [];
  private readonly requests = new Map<string, Promise<unknown>>();
  private activeCount = 0;
  private lastStartedAt: number | undefined;
  private pumping = false;

  schedule<T>(
    key: string,
    task: (signal: AbortSignal) => Promise<T> | T,
    signal?: AbortSignal
  ): Promise<T> {
    const existing = this.requests.get(key);
    if (existing) return existing as Promise<T>;
    if (signal?.aborted) return Promise.reject(this.abortError());

    let resolveRequest!: (value: T) => void;
    let rejectRequest!: (reason: unknown) => void;
    let settled = false;
    const promise = new Promise<T>((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });
    const controller = new AbortController();
    const request: ScheduledRequest = {
      key,
      controller,
      signal,
      cancelled: false,
      started: false,
      execute: () => {
        this.activeCount += 1;
        this.lastStartedAt = Date.now();
        void Promise.resolve()
          .then(() => task(controller.signal))
          .then(
            (value) => {
              settled = true;
              resolveRequest(value);
            },
            (error: unknown) => {
              settled = true;
              rejectRequest(error);
            }
          )
          .finally(() => {
            this.activeCount -= 1;
            this.requests.delete(key);
            if (request.abortListener) signal?.removeEventListener('abort', request.abortListener);
            this.pump();
          });
      }
    };

    request.abortListener = () => {
      if (request.started) {
        controller.abort();
        if (!settled) {
          settled = true;
          rejectRequest(this.abortError());
        }
        return;
      }
      request.cancelled = true;
      const index = this.queue.indexOf(request);
      if (index >= 0) this.queue.splice(index, 1);
      this.requests.delete(key);
      if (!settled) {
        settled = true;
        rejectRequest(this.abortError());
      }
      this.pump();
    };

    signal?.addEventListener('abort', request.abortListener, { once: true });
    this.requests.set(key, promise);
    this.queue.push(request);
    this.pump();
    return promise;
  }

  private pump(): void {
    if (this.pumping) return;
    this.pumping = true;
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    try {
      while (this.activeCount < 2 && this.queue.length > 0) {
        const request = this.queue.shift();
        if (!request || request.cancelled) continue;

        const elapsed = this.lastStartedAt === undefined ? 1000 : Date.now() - this.lastStartedAt;
        if (elapsed < 1000) {
          this.queue.unshift(request);
          await new Promise<void>((resolve) => setTimeout(resolve, 1000 - elapsed));
          continue;
        }

        if (request.signal?.aborted) {
          request.abortListener?.();
          continue;
        }

        request.started = true;
        request.execute();
      }
    } finally {
      this.pumping = false;
      if (this.activeCount < 2 && this.queue.length > 0) this.pump();
    }
  }

  private abortError(): DOMException {
    return new DOMException('The municipal request was aborted', 'AbortError');
  }
}
