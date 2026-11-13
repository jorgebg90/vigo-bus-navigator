import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { renderOpenApiDocument } from './openapi-docs-template';

const sourcePath = 'specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml';
const canonical = parse(readFileSync(sourcePath, 'utf8')) as Record<string, unknown>;

describe('self-hosted Swagger UI template', () => {
  it('embeds the complete canonical contract without modifying its models or operations', () => {
    const html = renderOpenApiDocument(canonical);
    const json = html.match(/<script id="openapi-spec" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
    expect(json).toBeDefined();
    expect(JSON.parse(json!)).toEqual(canonical);
    expect(html).toContain('SwaggerUIBundle({');
    expect(html).toContain('src="./swagger-ui-bundle.js"');
    expect(html).toContain('href="./swagger-ui.css"');
  });

  it('disables external validation, request execution and persisted credentials', () => {
    const html = renderOpenApiDocument(canonical);
    expect(html).toContain('validatorUrl: null');
    expect(html).toContain('supportedSubmitMethods: []');
    expect(html).toContain('persistAuthorization: false');
    expect(html).toContain('withCredentials: false');
    expect(html).not.toContain('src="https://');
    expect(html).not.toContain('href="https://');
  });

  it('escapes YAML and safely embeds JSON containing script terminators', () => {
    const document = {
      ...canonical,
      info: { title: '</script><img src=x onerror=alert(1)>', version: '1' }
    };
    const html = renderOpenApiDocument(document);
    expect(html).not.toContain('<img src=x');
    const json = html.match(/<script id="openapi-spec" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
    expect(JSON.parse(json!)).toEqual(document);
    expect(html).toContain('&lt;/script&gt;');
  });

  it('retains read-only YAML, architecture policies, contract navigation and source identity', () => {
    const html = renderOpenApiDocument(canonical, 'original: "<safe>"\n', sourcePath);
    expect(html).toContain('original: &quot;&lt;safe&gt;&quot;');
    expect(html).toContain('OpenAPI YAML · read only');
    expect(html).toContain('Architecture and source policies');
    expect(html).toContain('x-hexagonal');
    expect(html).toContain('aria-label="Application API contracts"');
    expect(html).toContain('href="./route-planning.html"');
    expect(html).toContain(sourcePath);
    expect(html).toContain('Interactive documentation is unavailable.');
  });

  it('produces deterministic output and supports an empty contract', () => {
    expect(renderOpenApiDocument(canonical)).toBe(renderOpenApiDocument(canonical));
    const empty = { openapi: '3.1.0', info: { title: 'Empty', version: '1' }, paths: {} };
    expect(renderOpenApiDocument(empty)).toContain('"paths":{}');
  });
});
