import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';
import { parseDocument } from 'yaml';

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected an object in route-planner contract test data');
  }
  return value as JsonRecord;
}

const contractPath = new URL('../specs/011-bus-itinerary-search/contracts/route-planning.openapi.yaml', import.meta.url);
const fixturePath = new URL('../specs/example.json', import.meta.url);

async function loadContract(): Promise<JsonRecord> {
  const document = parseDocument(await readFile(contractPath, 'utf8'));
  expect(document.errors).toEqual([]);
  return asRecord(document.toJSON());
}

describe('observed Vigo OTP route-planner contract', () => {
  it('documents the fixed endpoint and the observed request parameters', async () => {
    const contract = await loadContract();
    const servers = contract.servers as JsonRecord[];
    const paths = asRecord(contract.paths);
    const path = asRecord(paths['/otp/routers/default/plan']);
    const operation = asRecord(path.get);
    const parameters = operation.parameters as JsonRecord[];
    const parametersByName = new Map(parameters.map((parameter) => {
      const parsed = asRecord(parameter);
      return [String(parsed.name), parsed] as const;
    }));

    expect(servers[0].url).toBe('https://planificador-rutas.vigo.org');
    expect([...parametersByName.keys()].sort()).toEqual([
      'fromPlace', 'toPlace', 'arriveBy', 'date', 'time', 'locale',
      'showIntermediateStops', 'mode', 'numItineraries', 'walkSpeed',
      'maxWalkTime', 'wheelchair', 'maxWalkDistance', 'itineraryId',
      'optimize', 'walkReluctance', 'maxTransfers'
    ].sort());
    const fixedParameters: Record<string, unknown> = {
      arriveBy: false,
      locale: 'es',
      showIntermediateStops: true,
      mode: 'TRANSIT',
      numItineraries: 4,
      walkSpeed: 1.4,
      maxWalkTime: 10,
      wheelchair: false,
      maxWalkDistance: 500,
      maxTransfers: 2,
      itineraryId: 'fast',
      optimize: 'QUICK',
      walkReluctance: 10
    };
    for (const [name, value] of Object.entries(fixedParameters)) {
      expect(asRecord(parametersByName.get(name)?.schema).const).toBe(value);
    }
    expect(operation).toHaveProperty('operationId', 'planVigoTransitJourney');
  });

  it('validates the captured response fixture against the documented schema', async () => {
    const contract = await loadContract();
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8')) as unknown;
    const paths = asRecord(contract.paths);
    const path = asRecord(paths['/otp/routers/default/plan']);
    const operation = asRecord(path.get);
    const responses = asRecord(operation.responses);
    const success = asRecord(responses['200']);
    const content = asRecord(success.content);
    const jsonContent = asRecord(content['application/json']);
    const responseSchema = asRecord(jsonContent.schema);
    const components = asRecord(contract.components);
    const schemas = asRecord(components.schemas);
    const validator = new Ajv2020({ strict: false, allErrors: true }).compile({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://vigo-bus-navigator.example/otp-response.schema.json',
      components: { schemas },
      ...responseSchema
    });

    expect(validator(fixture), JSON.stringify(validator.errors)).toBe(true);
    const response = asRecord(fixture);
    const plan = asRecord(response.plan);
    const itineraries = plan.itineraries as unknown[];
    expect(itineraries).toHaveLength(4);
    for (const rawItinerary of itineraries) {
      const itinerary = asRecord(rawItinerary);
      const legs = itinerary.legs as unknown[];
      expect(legs.some((rawLeg) => asRecord(rawLeg).mode === 'BUS')).toBe(true);
      expect(legs.every((rawLeg) => {
        const leg = asRecord(rawLeg);
        return ['BUS', 'WALK'].includes(String(leg.mode))
          && typeof asRecord(leg.legGeometry).points === 'string';
      })).toBe(true);
    }

    const invalidFixture = structuredClone(asRecord(fixture));
    delete invalidFixture.plan;
    expect(validator(invalidFixture)).toBe(false);
  });
});
