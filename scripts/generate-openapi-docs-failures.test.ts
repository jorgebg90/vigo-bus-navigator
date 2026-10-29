import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateOpenApiDocs } from './generate-openapi-docs';

const canonicalPath = 'specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml';
const remediation = 'Correct the canonical contract and rerun npm run build';

describe('OpenAPI documentation failure behavior', () => {
  it.each([
    ['missing input', 'missing-input', async (directory: string) => join(directory, 'missing.yaml')],
    ['unreadable input', 'unreadable-input', async (directory: string) => {
      const input = join(directory, 'unreadable');
      await mkdir(input);
      return input;
    }],
    ['invalid YAML', 'invalid-yaml', async (directory: string) => writeContract(directory, 'paths: [\n')],
    ['invalid OpenAPI structure', 'invalid-openapi', async (directory: string) => writeContract(directory, 'openapi: 3.0.0\ninfo: {}\npaths: {}\n')],
    ['invalid nested response', 'invalid-openapi', async (directory: string) => writeContract(
      directory,
      'openapi: 3.1.0\ninfo: { title: Test, version: "1" }\npaths: { /test: { get: { responses: { "200": {} } } } }\n'
    )],
    ['invalid nested response schema', 'invalid-openapi', async (directory: string) => writeContract(
      directory,
      `openapi: 3.1.0
info:
  title: Test
  version: "1"
paths:
  /test:
    get:
      responses:
        "200":
          description: ok
          content:
            application/json:
              schema: malformed-schema-value
`
    )],
    ['invalid parameter shape', 'invalid-openapi', async (directory: string) => writeContract(
      directory,
      'openapi: 3.1.0\ninfo: { title: Test, version: "1" }\npaths: { /test: { get: { parameters: [{ name: id, in: query }], responses: { "200": { description: ok } } } } }\n'
    )],
    ['unresolved reference', 'unresolved-reference', async (directory: string) => writeContract(
      directory,
      'openapi: 3.1.0\ninfo: { title: Test, version: "1" }\npaths: { /test: { get: { responses: { "200": { description: ok } } } } }\ncomponents: { schemas: { Broken: { $ref: "#/components/schemas/Missing" } } }\n'
    )],
    ['renderer error', 'render-error', async (directory: string) => writeContract(
      directory,
      'openapi: 3.1.0\ninfo: { title: Test, version: "1" }\npaths: { /test: { get: { responses: { "200": { description: ok } } } } }\n'
    )]
  ])('removes stale pages and reports %s with actionable guidance', async (_label, category, createInput) => {
    const directory = await mkdtemp(join(tmpdir(), 'openapi-docs-failure-'));
    const output = join(directory, 'public', 'docs', 'openapi', 'index.html');
    const distOutput = join(directory, 'dist', 'docs', 'openapi', 'index.html');
    const input = await createInput(directory);
    await mkdir(join(directory, 'public', 'docs', 'openapi'), { recursive: true });
    await mkdir(join(directory, 'dist', 'docs', 'openapi'), { recursive: true });
    await writeFile(output, '<html>stale public page</html>');
    await writeFile(distOutput, '<html>stale dist page</html>');
    try {
      const options = {
        contractPath: input,
        outputPath: output,
        distOutputPath: distOutput,
        ...(category === 'render-error' ? { renderer: () => { throw new Error('injected renderer failure'); } } : {})
      };
      const error = await generateOpenApiDocs(options).then(
        () => undefined,
        (reason: unknown) => reason
      );
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(canonicalPath);
      expect((error as Error).message).toContain(category);
      expect((error as Error).message).toContain(remediation);
      await expect(readFile(output, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(readFile(distOutput, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('builds before the Pages artifact upload so a failed build cannot publish stale output', async () => {
    const workflow = await readFile('.github/workflows/deploy.yml', 'utf8');
    const buildStep = workflow.indexOf('run: npm run build');
    const uploadStep = workflow.indexOf('uses: actions/upload-pages-artifact@v3');
    expect(buildStep).toBeGreaterThanOrEqual(0);
    expect(uploadStep).toBeGreaterThan(buildStep);
    expect(workflow.slice(buildStep, uploadStep)).not.toMatch(/if:\s*always\(\)/);
  });
});

async function writeContract(directory: string, content: string): Promise<string> {
  const input = join(directory, 'contract.yaml');
  await writeFile(input, content);
  return input;
}
