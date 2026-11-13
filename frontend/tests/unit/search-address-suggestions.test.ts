import { describe, expect, it, vi } from 'vitest';
import { searchAddressSuggestions } from '../../src/application/search-address-suggestions';
import type { AddressGeocodingPort } from '../../src/application/ports';

describe('searchAddressSuggestions', () => {
  it('trims and forwards sufficiently long queries through the port', async () => {
    const searchAddresses = vi.fn<AddressGeocodingPort['searchAddresses']>()
      .mockResolvedValue({ kind: 'success', suggestions: [] });
    const geocoder = { searchAddresses };
    const cancellation = { isCancelled: () => false, onCancelled: () => () => undefined };
    await expect(searchAddressSuggestions(geocoder, '  Rúa do Príncipe  ', cancellation))
      .resolves.toEqual({ kind: 'success', suggestions: [] });
    expect(searchAddresses).toHaveBeenCalledWith('Rúa do Príncipe', cancellation);
  });

  it('does not make provider requests for short or overlong queries', async () => {
    const searchAddresses = vi.fn<AddressGeocodingPort['searchAddresses']>();
    const geocoder = { searchAddresses };
    await expect(searchAddressSuggestions(geocoder, '  ab ')).resolves.toEqual({
      kind: 'success',
      suggestions: []
    });
    await expect(searchAddressSuggestions(geocoder, 'x'.repeat(181))).resolves.toEqual({
      kind: 'unavailable',
      reason: 'invalid'
    });
    expect(searchAddresses).not.toHaveBeenCalled();
  });
});
