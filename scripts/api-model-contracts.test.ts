import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { MunicipalGeocoder } from '../frontend/src/infrastructure/geocoding/municipal-geocoder';
import { OtpRoutePlanner } from '../frontend/src/infrastructure/routing/otp-route-planner';
import { openApiContracts } from './openapi-contracts';

async function validatorFor(path: string, model: string) {
  const contract = parse(await readFile(path, 'utf8')) as Record<string, unknown>;
  return new Ajv2020({ strict: false, allErrors: true }).compile({
    components: contract.components,
    $ref: `#/components/schemas/${model}`
  });
}

describe('OpenAPI normalized models match hexagonal adapter outputs', () => {
  it('validates municipal address suggestions and discriminated results', async () => {
    const validate = await validatorFor(openApiContracts[1].path, 'AddressSearchResult');
    const geocoder = new MunicipalGeocoder(async () => Response.json({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-8.7105, 42.23261] },
        properties: { gid: 'custom:street:44945', layer: 'street', name: 'Rúa de Urzáiz', label: 'Rúa de Urzáiz, Vigo, GA, Spain' }
      }]
    }));
    const result = await geocoder.searchAddresses('Urzaiz');
    expect(result.kind).toBe('success');
    for (const value of [
      result, { kind: 'success', suggestions: [] },
      { kind: 'cancelled' },
      ...['network', 'http', 'invalid', 'oversized'].map((reason) => ({ kind: 'unavailable', reason }))
    ]) expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ kind: 'success' })).toBe(false);
    expect(validate({ kind: 'unavailable', reason: 'undocumented' })).toBe(false);
  });

  it('validates real OTP fixture normalization, query and port result variants', async () => {
    const validate = await validatorFor(openApiContracts[2].path, 'RoutePlanningResult');
    const query = {
      origin: { latitude: 42.23419, longitude: -8.71358 },
      destination: { latitude: 42.22151, longitude: -8.7327 },
      departureLocal: '2026-11-13T15:53'
    };
    const validateQuery = await validatorFor(openApiContracts[2].path, 'TransitJourneyQuery');
    expect(validateQuery(query), JSON.stringify(validateQuery.errors)).toBe(true);
    const fixture: unknown = JSON.parse(await readFile('specs/example.json', 'utf8'));
    const result = await new OtpRoutePlanner(async () => Response.json(fixture)).plan(query);
    expect(result.kind).toBe('success');
    for (const value of [
      result, { kind: 'success', journeys: [] }, { kind: 'cancelled' },
      ...['invalid', 'http', 'network', 'timeout', 'oversized', 'service'].map((reason) => ({ kind: 'unavailable', reason }))
    ]) expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ kind: 'success', journeys: [{}] })).toBe(false);
    expect(validate({ kind: 'unavailable', reason: 'undocumented' })).toBe(false);
  });
});
