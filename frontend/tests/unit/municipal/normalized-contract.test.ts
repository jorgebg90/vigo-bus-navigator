import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { parseDocument } from 'yaml';
import { describe, expect, it } from 'vitest';
import { isReceiptTimestampConsistent } from '../../../src/domain/municipal-contract';

const contractPath = resolve(
  process.cwd(),
  'specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml'
);
const contract = parseDocument(readFileSync(contractPath, 'utf8')).toJSON() as {
  components: { schemas: Record<string, unknown> };
  'x-browser-ports': Record<string, { outputSchema?: string } | string>;
};
const schemaId = 'https://vigo-bus-navigator.invalid/municipal-transit-v5.openapi.yaml';
const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
ajv.addSchema({ ...contract, $id: schemaId });

function validateSchema(name: string) {
  return ajv.compile({ $ref: `${schemaId}#/components/schemas/${name}` });
}

describe('OpenAPI v5 normalized browser contract', () => {
  it('compiles every declared browser-port output schema', () => {
    const outputs = Object.entries(contract['x-browser-ports'])
      .flatMap(([name, value]) => typeof value === 'object' && value.outputSchema
        ? [[name, value.outputSchema] as const]
        : []);

    expect(outputs.length).toBeGreaterThan(0);
    for (const [name, reference] of outputs) {
      expect(reference).toMatch(/^#\/components\/schemas\//);
      expect(() => ajv.compile({ $ref: `${schemaId}${reference}` }), name).not.toThrow();
    }
  });

  it('requires both stop coordinates to be valid or both null', () => {
    const validate = validateSchema('NetworkStop');
    const base = {
      id: 'app-stop-90',
      code: '90',
      municipalCode: '2789',
      vitrasaId: '90',
      name: 'Synthetic stop',
      lineIds: []
    };

    expect(validate({ ...base, lat: 42.23, lon: -8.62 })).toBe(true);
    expect(validate({ ...base, lat: null, lon: null })).toBe(true);
    expect(validate({ ...base, lat: 42.23, lon: null })).toBe(false);
    expect(validate({ ...base, lat: null, lon: -8.62 })).toBe(false);
    expect(validate({ ...base, lat: 0, lon: 0 })).toBe(false);
  });

  it('rejects invented ETA fields and requires exact receipt/provenance time equality', () => {
    const validate = validateSchema('ArrivalReceipt');
    const fetchedAt = '2026-10-27T12:00:00.000Z';
    const receipt = {
      stopId: 'app-stop-90',
      vitrasaId: '90',
      fetchedAt,
      arrivals: [{ lineCode: 'A', destination: 'Synthetic destination', minutes: 5 }],
      provenance: { kind: 'municipal', sourceName: 'Municipal source', fetchedAt }
    } as const;

    expect(validate(receipt)).toBe(true);
    expect(validate({
      ...receipt,
      arrivals: [{ ...receipt.arrivals[0], eta: fetchedAt }]
    })).toBe(false);
    expect(isReceiptTimestampConsistent(receipt)).toBe(true);
    expect(isReceiptTimestampConsistent({
      ...receipt,
      provenance: { ...receipt.provenance, fetchedAt: '2026-10-27T11:59:59.000Z' }
    })).toBe(false);
  });

  it('accepts only the normalized failure categories', () => {
    const validate = validateSchema('OperationFailure');
    const reasons = [
      'transport',
      'timeout',
      'rate-limited',
      'http',
      'invalid',
      'oversized',
      'identity-unverified',
      'mapping-unverified',
      'offline'
    ];

    for (const reason of reasons) {
      expect(validate({ kind: 'unavailable', reason })).toBe(true);
    }
    expect(validate({ kind: 'unavailable', reason: 'cors' })).toBe(false);
  });
});
