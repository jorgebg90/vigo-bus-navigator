import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { generateOpenApiDocs } from './generate-openapi-docs';
import { renderOpenApiDocument } from './openapi-docs-template';

const canonicalPath = 'specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml';

describe('OpenAPI documentation generator', () => {
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
