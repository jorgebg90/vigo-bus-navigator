import type { AddressSuggestion, AddressSearchResult } from '../../domain/journey-address';
import type { AddressGeocodingPort } from '../../application/ports';
import type { RequestCancellationPort } from '../../application/ports';
import { MAX_RESPONSE_BYTES, readBoundedResponse } from '../http/bounded-response';
import { isWithinMapCoverage } from '../../domain/map-stops';

const ENDPOINT = 'https://planificador-rutas-api.vigo.org/v1/autocomplete';
const MAX_SUGGESTIONS = 5;
const REQUEST_TIMEOUT_MS = 5_000;

export class MunicipalGeocoder implements AddressGeocodingPort {
  constructor(private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis)) {}

  async searchAddresses(query: string, cancellation?: RequestCancellationPort): Promise<AddressSearchResult> {
    if (cancellation?.isCancelled()) return { kind: 'cancelled' };
    const url = new URL(ENDPOINT);
    url.searchParams.set('text', query);
    url.searchParams.set('layers', 'venue,street');
    url.searchParams.set('lang', 'es');

    const controller = new AbortController();
    const unsubscribeCancellation = cancellation?.onCancelled(() => controller.abort()) ?? (() => undefined);
    if (cancellation?.isCancelled()) controller.abort();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await this.fetcher(url.toString(), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        signal: controller.signal
      });
      if (!response.ok) return { kind: 'unavailable', reason: 'http' };
      let payloadBytes: Uint8Array;
      try {
        payloadBytes = await readBoundedResponse(response, MAX_RESPONSE_BYTES);
      } catch (error) {
        if (error instanceof RangeError) return { kind: 'unavailable', reason: 'oversized' };
        throw error;
      }

      if (cancellation?.isCancelled()) return { kind: 'cancelled' };
      const text = new TextDecoder().decode(payloadBytes);
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        return { kind: 'unavailable', reason: 'invalid' };
      }
      const suggestions = decodeSuggestions(payload);
      if (suggestions === null) return { kind: 'unavailable', reason: 'invalid' };
      return { kind: 'success', suggestions };
    } catch (error) {
      if (controller.signal.aborted) {
        return cancellation?.isCancelled()
          ? { kind: 'cancelled' }
          : { kind: 'unavailable', reason: 'network' };
      }
      if (error instanceof TypeError) return { kind: 'unavailable', reason: 'network' };
      throw error;
    } finally {
      clearTimeout(timeout);
      unsubscribeCancellation();
    }
  }
}

function decodeSuggestions(payload: unknown): AddressSuggestion[] | null {
  if (!isRecord(payload) || payload.type !== 'FeatureCollection' || !Array.isArray(payload.features)) return null;
  const suggestions: AddressSuggestion[] = [];
  const seen = new Set<string>();
  for (const feature of payload.features) {
    if (!isRecord(feature) || feature.type !== 'Feature' || !isRecord(feature.geometry) || feature.geometry.type !== 'Point'
      || !Array.isArray(feature.geometry.coordinates) || !isRecord(feature.properties)) continue;
    const [longitude, latitude] = feature.geometry.coordinates;
    if (typeof longitude !== 'number' || typeof latitude !== 'number'
      || !Number.isFinite(longitude) || !Number.isFinite(latitude)
      || !isWithinMapCoverage({ latitude, longitude, accuracyMeters: 0 })) continue;

    const properties = feature.properties;
    if (properties.layer !== 'venue' && properties.layer !== 'street') continue;
    const label = cleanText(properties.label) || cleanText(properties.name);
    const id = cleanText(properties.gid);
    if (!label || !id || seen.has(id)) continue;
    seen.add(id);
    suggestions.push({ id, label, point: { latitude, longitude } });
    if (suggestions.length === MAX_SUGGESTIONS) break;
  }
  return suggestions;
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
