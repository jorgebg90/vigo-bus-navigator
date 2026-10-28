import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequestScheduler } from '../../../src/infrastructure/municipal/request-scheduler';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('municipal request scheduler', () => {
  afterEach(() => vi.useRealTimers());

  it('limits concurrent requests to two and spaces starts by at least one second', async () => {
    vi.useFakeTimers();
    const scheduler = new RequestScheduler();
    const first = deferred<string>();
    const second = deferred<string>();
    const third = deferred<string>();
    const starts: number[] = [];

    const tasks = [
      scheduler.schedule('first', () => { starts.push(Date.now()); return first.promise; }),
      scheduler.schedule('second', () => { starts.push(Date.now()); return second.promise; }),
      scheduler.schedule('third', () => { starts.push(Date.now()); return third.promise; })
    ];

    await vi.advanceTimersByTimeAsync(0);
    expect(starts).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(starts).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(starts).toHaveLength(2);
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(1000);

    first.resolve('first');
    await vi.advanceTimersByTimeAsync(1000);
    expect(starts).toHaveLength(3);
    second.resolve('second');
    third.resolve('third');
    await expect(Promise.all(tasks)).resolves.toEqual(['first', 'second', 'third']);
  });

  it('coalesces requests with the same key into one promise and one task', async () => {
    const scheduler = new RequestScheduler();
    const result = deferred<string>();
    let calls = 0;
    const task = () => { calls += 1; return result.promise; };

    const first = scheduler.schedule('same', task);
    const duplicate = scheduler.schedule('same', task);
    expect(duplicate).toBe(first);
    await vi.waitFor(() => expect(calls).toBe(1));
    result.resolve('shared');
    await expect(duplicate).resolves.toBe('shared');
  });

  it('cancels a queued request before its task starts', async () => {
    vi.useFakeTimers();
    const scheduler = new RequestScheduler();
    const first = deferred<void>();
    const controller = new AbortController();
    let queuedTaskStarted = false;
    const active = scheduler.schedule('active', () => first.promise);
    const queued = scheduler.schedule('queued', () => {
      queuedTaskStarted = true;
      return Promise.resolve();
    }, controller.signal);

    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await expect(queued).rejects.toMatchObject({ name: 'AbortError' });
    first.resolve();
    await active;
    await vi.advanceTimersByTimeAsync(2000);
    expect(queuedTaskStarted).toBe(false);
  });

  it('rejects a running request when its caller aborts', async () => {
    const scheduler = new RequestScheduler();
    const controller = new AbortController();
    const started = deferred<void>();
    let taskSignal: AbortSignal | undefined;
    const request = scheduler.schedule('running', (signal) => {
      taskSignal = signal;
      started.resolve();
      return new Promise<void>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });
    }, controller.signal);
    const aborted = expect(request).rejects.toMatchObject({ name: 'AbortError' });

    await started.promise;
    controller.abort();
    await aborted;
    expect(taskSignal?.aborted).toBe(true);
  });

  it('propagates task rejection to the caller', async () => {
    const scheduler = new RequestScheduler();
    const expected = new Error('request failed');
    await expect(scheduler.schedule('failed', () => Promise.reject(expected))).rejects.toBe(expected);
  });
});
