import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { MunicipalAction } from '../../../src/infrastructure/municipal/request-builder';
import {
  lineCatalogActionFor,
  MunicipalLineCatalogAdapter,
  normalizeLineCatalog
} from '../../../src/infrastructure/municipal/line-catalog-adapter';

const readFixture = (name: string): unknown => JSON.parse(
  readFileSync(resolve(process.cwd(), `frontend/tests/fixtures/municipal/${name}`), 'utf8')
);

describe('municipal line catalog adapter', () => {
  it('selects only the source catalog action for the UI language', () => {
    expect(lineCatalogActionFor('gl')).toBe('TRANSPORTE_LINEAS_GA');
    expect(lineCatalogActionFor('es')).toBe('TRANSPORTE_LINEAS_ES');
    expect(lineCatalogActionFor('en')).toBe('TRANSPORTE_LINEAS_ES');
  });

  it('normalizes source line fields with explicit fixture provenance', () => {
    const catalog = normalizeLineCatalog(
      readFixture('line-catalog-es.json'),
      '2026-10-27T12:00:00.000Z',
      'fixture'
    );

    expect(catalog).toEqual({
      lines: [{
        id: 'A',
        code: 'A',
        name: 'Synthetic line A',
        color: '#007FFF',
        textColor: '#FFFFFF',
        displayOrder: 1
      }],
      provenance: {
        kind: 'fixture',
        sourceName: 'Synthetic municipal-contract fixture',
        fetchedAt: '2026-10-27T12:00:00.000Z'
      }
    });
  });

  it('preserves source order and allows sparse optional metadata', () => {
    const catalog = normalizeLineCatalog([
      { linea: 'B', descripcion: 'Line B', orden: 8 },
      { linea: 'A', descripcion: 'Line A', orden: 2, color: 'invalid', color_texto: '#12AB34' }
    ], '2026-10-27T12:00:00.000Z');

    expect(catalog.lines.map(({ code }) => code)).toEqual(['B', 'A']);
    expect(catalog.lines[0]).toMatchObject({ id: 'B', color: '#666666', displayOrder: 8 });
    expect(catalog.lines[0]).not.toHaveProperty('textColor');
    expect(catalog.lines[1]).toMatchObject({ color: '#666666', textColor: '#12AB34' });
  });

  it('rejects duplicate source line codes rather than silently choosing one', () => {
    expect(() => normalizeLineCatalog([
      { linea: 'A', descripcion: 'First' },
      { linea: 'A', descripcion: 'Duplicate' }
    ], '2026-10-27T12:00:00.000Z')).toThrow(expect.objectContaining({ reason: 'invalid' }));
  });

  it('rejects malformed rows and unbounded catalogs as one operation', () => {
    expect(() => normalizeLineCatalog([{ linea: 'A' }], '2026-10-27T12:00:00.000Z'))
      .toThrow(expect.objectContaining({ reason: 'invalid' }));
    expect(() => normalizeLineCatalog(new Array(10001).fill({
      linea: 'A',
      descripcion: 'Duplicate'
    }), '2026-10-27T12:00:00.000Z')).toThrow(expect.objectContaining({ reason: 'oversized' }));
  });

  it('sends only the selected locale action and stamps after normalization', async () => {
    const calls: unknown[][] = [];
    const get = vi.fn(async (
      action: MunicipalAction,
      parameters: Readonly<Record<string, unknown>>,
      signal?: AbortSignal
    ) => {
        calls.push([action, parameters, signal]);
        return readFixture('line-catalog-ga.json');
      });
    const adapter = new MunicipalLineCatalogAdapter({ get }, {
      now: () => new Date('2026-10-27T12:00:00.000Z'),
      onDateChange: () => () => undefined
    }, 'fixture');

    const result = await adapter.getCatalog('gl');

    expect(calls).toEqual([['TRANSPORTE_LINEAS_GA', {}, undefined]]);
    expect(result).toMatchObject({
      kind: 'success',
      value: {
        lines: [{ id: 'A', code: 'A' }],
        provenance: { kind: 'fixture', fetchedAt: '2026-10-27T12:00:00.000Z' }
      }
    });
  });

  it('uses the supported catalog action in the production profile', async () => {
    const get = vi.fn(async (
      _action: MunicipalAction,
      _parameters: Readonly<Record<string, unknown>>,
      _signal?: AbortSignal
    ) => []);
    const adapter = new MunicipalLineCatalogAdapter({ get }, {
      now: () => new Date('2026-10-27T12:00:00.000Z'),
      onDateChange: () => () => undefined
    }, 'production');

    await expect(adapter.getCatalog('en')).resolves.toMatchObject({
      kind: 'success',
      value: { lines: [], provenance: { kind: 'municipal' } }
    });
    expect(get).toHaveBeenCalledWith('TRANSPORTE_LINEAS_ES', {}, undefined);
  });
});
