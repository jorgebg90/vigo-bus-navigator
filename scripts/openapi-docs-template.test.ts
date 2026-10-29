import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { renderOpenApiDocument } from './openapi-docs-template';

const sourcePath = 'specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml';
const canonical = parse(readFileSync(sourcePath, 'utf8')) as Record<string, unknown>;

const fixture = {
  openapi: '3.1.0',
  info: { title: 'Transit <Contract>', version: '1.0', 'x-a11y': 'visible & safe' },
  paths: {
    '/routes/{routeId}': {
      parameters: [{ name: 'routeId', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        operationId: 'readRoute',
        summary: 'Read one route',
        parameters: [{ name: 'locale', in: 'query', schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Route found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Route' } } }
          }
        }
      },
      post: {
        operationId: 'createRoute',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Route' } } }
        },
        responses: { '201': { description: 'Route created' } }
      }
    }
  },
  components: {
    schemas: {
      Route: {
        type: 'object',
        description: 'Route <details>',
        properties: { id: { type: 'string', 'x-display': 'Identifier' } }
      }
    }
  },
  'x-contract-policy': { retained: true }
};

function sourcePointers(value: unknown, pointer = '#'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => sourcePointers(item, `${pointer}/${index}`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => {
      const childPointer = `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`;
      return [childPointer, ...sourcePointers(child, childPointer)];
    });
  }
  return [pointer];
}

describe('OpenAPI static HTML template', () => {
  it('renders semantic navigation, operation and schema content, bodies and responses', () => {
    const html = renderOpenApiDocument(fixture);

    expect(html).toContain('<main id="contract-content">');
    expect(html).toContain('<nav aria-label="On this page">');
    expect(html).toContain('Skip to contract content');
    expect(html).toContain('GET /routes/{routeId}');
    expect(html).toContain('POST /routes/{routeId}');
    expect(html).toContain('Parameters');
    expect(html).toContain('Request body');
    expect(html).toContain('Responses');
    expect(html).toContain('application/json');
    expect(html).toContain('Route');
    expect(html).toContain('201');
    expect(html).toContain('x-contract-policy');
    expect(html).toContain('href="#schema-Route"');
    const navigation = html.match(/<nav aria-label="On this page">([\s\S]*?)<\/nav>/)?.[1] ?? '';
    expect(navigation).not.toContain('<h3>Operations</h3>');
    expect(navigation).not.toContain('<h3>Schemas</h3>');
    expect(navigation).toContain('<p class="index-heading">Operations</p>');
    expect(navigation).toContain('<p class="index-heading">Schemas</p>');
  });

  it('represents every canonical contract pointer without inventing operations or schemas', () => {
    const html = renderOpenApiDocument(canonical);
    const visiblePointers = new Set(
      [...html.matchAll(/data-contract-pointer="([^"]+)"/g)].map((match) => match[1])
    );

    for (const pointer of sourcePointers(canonical)) {
      expect(visiblePointers, `missing visible source pointer ${pointer}`).toContain(pointer);
    }
    expect([...html.matchAll(/<article class="operation\b/g)]).toHaveLength(countOperations(canonical));
    expect([...html.matchAll(/<article class="schema\b/g)]).toHaveLength(
      Object.keys((canonical.components as { schemas?: object }).schemas ?? {}).length
    );
  });

  it('escapes contract-derived text and attributes', () => {
    const html = renderOpenApiDocument(fixture);
    expect(html).toContain('Transit &lt;Contract&gt;');
    expect(html).toContain('Route &lt;details&gt;');
    expect(html).toContain('visible &amp; safe');
    expect(html).not.toContain('<title>Transit <Contract>');
  });

  it('produces byte-for-byte deterministic output', () => {
    expect(renderOpenApiDocument(fixture)).toBe(renderOpenApiDocument(fixture));
  });

  it('explains empty operation and schema sections without creating entries', () => {
    const html = renderOpenApiDocument({ ...fixture, paths: {}, components: { schemas: {} } });

    expect(html).toContain('No operations are defined in this contract.');
    expect(html).toContain('No component schemas are defined in this contract.');
    expect(html).not.toContain('<article class="operation');
    expect(html).not.toContain('<article class="schema');
    const navigation = html.match(/<nav aria-label="On this page">([\s\S]*?)<\/nav>/)?.[1] ?? '';
    expect(navigation).not.toContain('<h3>Operations</h3>');
    expect(navigation).not.toContain('<h3>Schemas</h3>');
  });
});

function countOperations(document: Record<string, unknown>): number {
  const methods = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);
  const paths = document.paths as Record<string, Record<string, unknown>>;
  return Object.values(paths).reduce(
    (count, pathItem) => count + Object.keys(pathItem).filter((key) => methods.has(key)).length,
    0
  );
}
