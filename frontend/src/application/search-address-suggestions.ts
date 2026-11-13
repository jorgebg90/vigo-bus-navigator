import type { AddressSearchResult } from '../domain/journey-address';
import type { AddressGeocodingPort, RequestCancellationPort } from './ports';

export function searchAddressSuggestions(
  geocoder: AddressGeocodingPort,
  query: string,
  cancellation?: RequestCancellationPort
): Promise<AddressSearchResult> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 3) return Promise.resolve({ kind: 'success', suggestions: [] });
  if (normalizedQuery.length > 180) return Promise.resolve({ kind: 'unavailable', reason: 'invalid' });
  return geocoder.searchAddresses(normalizedQuery, cancellation);
}
