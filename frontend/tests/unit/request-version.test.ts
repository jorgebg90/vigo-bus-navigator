import { describe, expect, it } from 'vitest';
import { RequestVersion } from '../../src/application/request-version';

describe('request version', () => {
  it('marks prior asynchronous selections stale when a newer one starts', () => {
    const requests = new RequestVersion();
    const first = requests.next();
    const second = requests.next();

    expect(requests.isCurrent(first)).toBe(false);
    expect(requests.isCurrent(second)).toBe(true);
  });

  it('invalidates pending results when their view is left', () => {
    const requests = new RequestVersion();
    const pending = requests.next();

    requests.invalidate();

    expect(requests.isCurrent(pending)).toBe(false);
  });
});
