import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parseDocument } from 'yaml';

const contractPath = new URL('../specs/002-realtime-bus-api/contracts/realtime-arrivals.openapi.yaml', import.meta.url);

async function loadContract() {
  const source = await readFile(contractPath, 'utf8');
  const document = parseDocument(source);
  expect(document.errors).toEqual([]);
  return document.toJSON() as Record<string, any>;
}

describe('OpenAPI compatibility invariants', () => {
  it('keeps the published API version and existing resource paths', async () => {
    const contract = await loadContract();

    expect(contract.openapi).toBe('3.1.0');
    expect(contract.info.version).toBe('3.0.0');
    expect(Object.keys(contract.paths)).toEqual(expect.arrayContaining([
      '/lines',
      '/lines/{lineCode}',
      '/stops',
      '/stops/{stopCode}/arrivals',
      '/health'
    ]));
    expect(contract.paths['/lines']).toHaveProperty('get.operationId', 'listLines');
    expect(contract.paths['/lines/{lineCode}']).toHaveProperty('get.operationId', 'getLine');
    expect(contract.paths['/stops']).toHaveProperty('get.operationId', 'listStops');
    expect(contract.paths['/stops/{stopCode}/arrivals']).toHaveProperty('get.operationId', 'getStopArrivalsByCode');
    expect(contract.paths['/stops/{stopCode}/arrivals']).toHaveProperty('options.operationId', 'preflightStopArrivals');
    expect(contract.paths['/health']).toHaveProperty('get.operationId', 'getHealth');

    const lineListSchema = contract.paths['/lines'].get.responses['200'].content['application/json'].schema;
    const lineDetail = contract.components.schemas.NetworkLineDetail;
    expect(lineListSchema.required).toContain('scheduleMetadata');
    expect(lineListSchema.properties.scheduleMetadata).toEqual({ $ref: '#/components/schemas/ScheduleManifest' });
    expect(lineDetail.allOf[1].properties.timetable).toMatchObject({
      $ref: '#/components/schemas/Timetable',
      description: expect.stringContaining('only when a timetable is published')
    });
    expect(lineDetail.allOf[1].required).not.toContain('timetable');
  });

  it('keeps the arrivals endpoint identifier-only and preserves its response contract', async () => {
    const contract = await loadContract();
    const operation = contract.paths['/stops/{stopCode}/arrivals'].get;
    const stopId = operation.parameters.find((parameter: { name: string }) => parameter.name === 'stopCode');
    const response = contract.components.schemas.ArrivalsResponse;
    const arrival = contract.components.schemas.Arrival;
    const summary = contract.components.schemas.NetworkLineSummary;
    const detail = contract.components.schemas.NetworkLineDetail;

    expect(operation.requestBody).toBeUndefined();
    expect(operation.parameters).toHaveLength(1);
    expect(stopId).toMatchObject({ in: 'path', required: true, schema: { pattern: '^[0-9]{1,6}$' } });
    expect(response.required).toEqual(expect.arrayContaining(['stopId', 'generatedAt', 'dataStatus', 'arrivals']));
    expect(response.properties.stopId.type).toBe('string');
    expect(new RegExp(response.properties.stopId.pattern).test('123456')).toBe(true);
    expect(new RegExp(response.properties.stopId.pattern).test('1234567')).toBe(false);
    expect(new RegExp(response.properties.stopId.pattern).test('12x')).toBe(false);
    expect(response.properties.generatedAt).toMatchObject({ type: 'string', format: 'date-time' });
    expect(contract.components.schemas.DataStatus.enum).toEqual(['current', 'stale', 'empty']);
    expect(response.properties.arrivals).toMatchObject({ type: 'array', items: { $ref: '#/components/schemas/Arrival' } });
    expect(arrival.required).toEqual(expect.arrayContaining(['lineCode', 'destination', 'minutes', 'eta']));
    expect(arrival.properties.lineCode).toMatchObject({ type: 'string', minLength: 1 });
    expect(arrival.properties.destination).toMatchObject({ type: 'string', minLength: 1 });
    expect(arrival.properties.minutes).toMatchObject({ type: 'integer', minimum: 0, maximum: 1440 });
    expect(arrival.properties.eta).toMatchObject({ type: 'string', format: 'date-time' });

    expect(summary.required).toEqual(expect.arrayContaining(['id', 'code', 'name', 'color', 'stopCount', 'patternCount']));
    expect(summary.properties.stopCount).toMatchObject({ type: 'integer', minimum: 0 });
    expect(summary.properties.patternCount).toMatchObject({ type: 'integer', minimum: 0 });
    expect(detail.allOf[1].required).toContain('patterns');
    expect(detail.allOf[1].properties.patterns.items.required).toEqual(
      expect.arrayContaining(['id', 'headsign', 'stopIds', 'stops'])
    );
  });

  it('keeps stop ID namespaces nullable and coordinate bounds explicit', async () => {
    const contract = await loadContract();
    const stop = contract.components.schemas.NetworkStop;

    expect(stop.required).toEqual(expect.arrayContaining([
      'id', 'code', 'municipalCode', 'vitrasaId', 'name', 'lat', 'lon', 'lineIds'
    ]));
    expect(stop.properties.municipalCode.type).toEqual(['string', 'null']);
    expect(stop.properties.vitrasaId.type).toEqual(['string', 'null']);
    expect(stop.properties.lat).toMatchObject({ minimum: 42.1, maximum: 42.32 });
    expect(stop.properties.lon).toMatchObject({ minimum: -8.85, maximum: -8.6 });
  });
});