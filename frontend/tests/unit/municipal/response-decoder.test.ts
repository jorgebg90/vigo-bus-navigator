import { describe, expect, it } from 'vitest';
import { decodeMunicipalBytes } from '../../../src/infrastructure/municipal/response-decoder';

describe('municipal byte decoder', () => {
  it('decodes declared ISO-8859-1 bytes including Windows-1252 distinguishing values', () => {
    const bytes = Uint8Array.from([0x41, 0x80, 0x9f, 0xe9]);
    expect(decodeMunicipalBytes(bytes, 'application/json; charset=ISO-8859-1')).toBe('A€Ÿé');
  });

  it('accepts UTF-8 only when declared and valid', () => {
    expect(decodeMunicipalBytes(
      new TextEncoder().encode('{"name":"Vigo €"}'),
      'application/json; charset=utf-8'
    )).toBe('{"name":"Vigo €"}');
    expect(() => decodeMunicipalBytes(
      Uint8Array.from([0xc3, 0x28]),
      'application/json; charset=utf-8'
    )).toThrow(/encoding/i);
  });

  it('rejects unsupported, missing, contradictory, or non-JSON content types', () => {
    const bytes = new TextEncoder().encode('{}');
    expect(() => decodeMunicipalBytes(bytes, 'application/json; charset=utf-16')).toThrow(/charset/i);
    expect(() => decodeMunicipalBytes(bytes, 'application/json')).toThrow(/charset/i);
    expect(() => decodeMunicipalBytes(bytes, 'application/json; charset=utf-8; charset=iso-8859-1')).toThrow(/charset/i);
    expect(() => decodeMunicipalBytes(bytes, 'text/html; charset=utf-8')).toThrow(/content type/i);
  });
});
