import { describe, expect, it } from 'vitest';
import { MunicipalOperationError } from '../../src/domain/municipal-failures';

describe('MunicipalOperationError', () => {
  it('preserves the classified failure reason and optional HTTP status', () => {
    const error = new MunicipalOperationError('rate-limited', 'Retry later', 429);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('MunicipalOperationError');
    expect(error.message).toBe('Retry later');
    expect(error.reason).toBe('rate-limited');
    expect(error.status).toBe(429);
  });

  it('leaves the status undefined for failures without an HTTP response', () => {
    const error = new MunicipalOperationError('offline', 'No network');

    expect(error.status).toBeUndefined();
  });
});
