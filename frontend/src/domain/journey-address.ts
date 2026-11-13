import type { JourneyPoint } from './journey';

export interface AddressSuggestion {
  id: string;
  label: string;
  point: JourneyPoint;
}

export type AddressSearchResult =
  | { kind: 'success'; suggestions: AddressSuggestion[] }
  | { kind: 'unavailable'; reason: 'network' | 'http' | 'invalid' | 'oversized' }
  | { kind: 'cancelled' };
