import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { generateAllOpenApiDocs, generateOpenApiDocs } from './generate-openapi-docs';
import { renderOpenApiDocument } from './openapi-docs-template';
import { openApiContracts } from './openapi-contracts';

const canonicalPath = 'specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml';

describe('OpenAPI documentation generator', () => {
  it('publishes every current contract with correct source, navigation and normalized models', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'openapi-portal-'));
    try {
      const outputs = await generateAllOpenApiDocs(join(directory, 'public'), join(directory, 'dist'));
      expect(outputs).toHaveLength(4);
      for (const [index, contract] of openApiContracts.entries()) {
        const html = await readFile(outputs[index], 'utf8');
        expect(html).toContain(`<h1>${contract.title}</h1>`);
        expect(html).toContain(contract.path);
        expect(html).toContain('x-hexagonal');
        for (const linked of openApiContracts) expect(html).toContain(`href="./${linked.page}"`);
      }
      expect(await readFile(outputs[1], 'utf8')).toContain('AddressSearchResult');
      expect(await readFile(outputs[2], 'utf8')).toContain('RoutePlanningResult');
      expect(await readFile(outputs[3], 'utf8')).toContain('getBasemapGlyphs');
      for (const asset of ['swagger-ui.css', 'swagger-ui-bundle.js', 'swagger-ui-LICENSE.txt', 'swagger-ui-NOTICE.txt']) {
        expect((await readFile(join(directory, 'public', asset))).length).toBeGreaterThan(0);
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('writes a deterministic page representing the canonical contract', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'openapi-docs-'));
    const input = join(directory, 'contract.yaml');
    const output = join(directory, 'public', 'docs', 'openapi', 'index.html');
    const distOutput = join(directory, 'dist', 'docs', 'openapi', 'index.html');
    try {
      await generateOpenApiDocs({ contractPath: canonicalPath, outputPath: output, distOutputPath: distOutput });
      const html = await readFile(output, 'utf8');
      const source = await readFile(canonicalPath, 'utf8');
      const document = parse(source) as Record<string, unknown>;
      expect(html).toBe(renderOpenApiDocument(document, source));
      expect(html.length).toBeGreaterThan(0);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
