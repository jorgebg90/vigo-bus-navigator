import { describe, expect, it } from 'vitest';
import { isNumericId, isOpaqueId } from '../../../src/infrastructure/municipal/request-validation';

describe('municipal request identifiers', () => {
  it('accepts opaque IDs with interior spaces and preserves their source identity', () => {
    expect(isOpaqueId('trip A 1')).toBe(true);
    expect(isOpaqueId('shape/1005')).toBe(true);
  });

  it('rejects empty, whitespace-only, overlong, and control-character opaque IDs', () => {
    expect(isOpaqueId('')).toBe(false);
    expect(isOpaqueId(' \t ')).toBe(false);
    expect(isOpaqueId('x'.repeat(129))).toBe(false);
    expect(isOpaqueId('trip\nA')).toBe(false);
    expect(isOpaqueId(`a${String.fromCharCode(127)}b`)).toBe(false);
  });

  it('accepts only canonical decimal numeric IDs of at most twelve digits', () => {
    expect(isNumericId('0')).toBe(true);
    expect(isNumericId('123456789012')).toBe(true);
    expect(isNumericId('1234567890123')).toBe(false);
    expect(isNumericId(' 90')).toBe(false);
    expect(isNumericId('90.0')).toBe(false);
    expect(isNumericId('-90')).toBe(false);
  });
});
