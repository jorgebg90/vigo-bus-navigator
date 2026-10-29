import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { parseDocument } from 'yaml';
import { renderOpenApiDocument } from './openapi-docs-template';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const canonicalPath = 'specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml';
const remediation = 'Correct the canonical contract and rerun npm run build.';
const schemaId = 'https://vigo-bus-navigator.invalid/openapi-docs-contract';
const httpMethods = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

type OpenApiDocument = Record<string, unknown>;
type Renderer = (document: OpenApiDocument) => string;

export interface GenerateOpenApiDocsOptions {
  contractPath?: string;
  outputPath?: string;
  distOutputPath?: string;
  renderer?: Renderer;
}

function fail(category: string, details: string, cause?: unknown): Error {
  const message = `OpenAPI docs generation failed [${category}]: ${canonicalPath}. ${details} ${remediation}`;
  const error = new Error(message);
  if (cause !== undefined) error.cause = cause;
  return error;
}

function isRecord(value: unknown): value is OpenApiDocument {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function resolvePointer(document: unknown, reference: string): unknown {
  if (reference === '#') return document;
  if (!reference.startsWith('#/')) return undefined;
  const tokens = decodeURIComponent(reference.slice(2)).split('/').map((token) =>
    token.replaceAll('~1', '/').replaceAll('~0', '~')
  );
  let current = document;
  for (const token of tokens) {
    if (Array.isArray(current)) {
      const index = Number(token);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) return undefined;
      current = current[index];
    } else if (isRecord(current) && Object.hasOwn(current, token)) {
      current = current[token];
    } else {
      return undefined;
    }
  }
  return current;
}

function validateLocalReferences(document: unknown): void {
  const unresolved: string[] = [];
  function visit(value: unknown, pointer: string): void {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${pointer}/${index}`));
      return;
    }
    if (!isRecord(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const childPointer = `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`;
      if ((key === '$ref' || key === '$dynamicRef') && typeof child === 'string' && child.startsWith('#')) {
        try {
          if (resolvePointer(document, child) === undefined) unresolved.push(`${childPointer} -> ${child}`);
        } catch {
          unresolved.push(`${childPointer} -> ${child}`);
        }
      }
      visit(child, childPointer);
    }
  }
  visit(document, '#');
  if (unresolved.length > 0) {
    throw fail('unresolved-reference', `Unresolved local reference(s): ${unresolved.join('; ')}.`);
  }
}

function validateOpenApi(document: unknown): asserts document is OpenApiDocument {
  if (!isRecord(document) || typeof document.openapi !== 'string' || !/^3\.1\.\d+$/.test(document.openapi)) {
    throw fail('invalid-openapi', 'The document must declare an OpenAPI 3.1 version.');
  }
  if (!isRecord(document.info) || typeof document.info.title !== 'string' || !document.info.title.trim()
    || typeof document.info.version !== 'string' || !document.info.version.trim()) {
    throw fail('invalid-openapi', 'The document must define non-empty info.title and info.version values.');
  }
  if (!isRecord(document.paths) || Object.keys(document.paths).length === 0) {
    throw fail('invalid-openapi', 'The document must define at least one path item.');
  }
  for (const [path, rawPathItem] of Object.entries(document.paths)) {
    if (!path.startsWith('/') || !isRecord(rawPathItem)) {
      throw fail('invalid-openapi', `Path "${path}" must be an absolute path item object.`);
    }
    validateParameters(rawPathItem.parameters, `Path "${path}"`);
    const operations = Object.entries(rawPathItem).filter(([key]) => httpMethods.has(key));
    if (operations.length === 0) throw fail('invalid-openapi', `Path "${path}" has no HTTP operations.`);
    for (const [method, rawOperation] of operations) {
      if (!isRecord(rawOperation) || !isRecord(rawOperation.responses)) {
        throw fail('invalid-openapi', `Operation ${method.toUpperCase()} ${path} must define a responses object.`);
      }
      validateParameters(rawOperation.parameters, `Operation ${method.toUpperCase()} ${path}`);
      if (rawOperation.requestBody !== undefined) {
        validateRequestBody(rawOperation.requestBody, `Operation ${method.toUpperCase()} ${path}`);
      }
      validateResponses(rawOperation.responses, `Operation ${method.toUpperCase()} ${path}`);
    }
  }
  if (document.components !== undefined && !isRecord(document.components)) {
    throw fail('invalid-openapi', 'The components value must be an object.');
  }
  const components = document.components as OpenApiDocument | undefined;
  for (const componentType of ['schemas', 'parameters', 'responses', 'requestBodies']) {
    if (components?.[componentType] !== undefined && !isRecord(components[componentType])) {
      throw fail('invalid-openapi', `The components.${componentType} value must be an object.`);
    }
  }
  for (const [name, parameter] of Object.entries((components?.parameters ?? {}) as OpenApiDocument)) {
    validateParameters([parameter], `Component parameter "${name}"`);
  }
  for (const [name, response] of Object.entries((components?.responses ?? {}) as OpenApiDocument)) {
    validateResponses({ default: response }, `Component response "${name}"`);
  }
  for (const [name, requestBody] of Object.entries((components?.requestBodies ?? {}) as OpenApiDocument)) {
    validateRequestBody(requestBody, `Component requestBody "${name}"`);
  }
}

function validateParameters(value: unknown, owner: string): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw fail('invalid-openapi', `${owner} parameters must be an array.`);
  for (const [index, rawParameter] of value.entries()) {
    const label = `${owner} parameter ${index + 1}`;
    if (!isRecord(rawParameter)) throw fail('invalid-openapi', `${label} must be an object.`);
    if (typeof rawParameter.$ref === 'string') continue;
    if (typeof rawParameter.name !== 'string' || !rawParameter.name.trim()
      || !['query', 'header', 'path', 'cookie'].includes(String(rawParameter.in))) {
      throw fail('invalid-openapi', `${label} must define a non-empty name and a valid "in" location.`);
    }
    if (rawParameter.required !== undefined && typeof rawParameter.required !== 'boolean') {
      throw fail('invalid-openapi', `${label} required must be a boolean.`);
    }
    if (rawParameter.in === 'path' && rawParameter.required !== true) {
      throw fail('invalid-openapi', `${label} in path must set required: true.`);
    }
    if ((rawParameter.schema === undefined) === (rawParameter.content === undefined)) {
      throw fail('invalid-openapi', `${label} must define exactly one of schema or content.`);
    }
    if (rawParameter.content !== undefined) validateContent(rawParameter.content, `${label} content`);
  }
}

function validateRequestBody(value: unknown, owner: string): void {
  if (!isRecord(value)) throw fail('invalid-openapi', `${owner} requestBody must be an object.`);
  if (typeof value.$ref === 'string') return;
  if (value.required !== undefined && typeof value.required !== 'boolean') {
    throw fail('invalid-openapi', `${owner} requestBody required must be a boolean.`);
  }
  validateContent(value.content, `${owner} requestBody content`);
}

function validateResponses(value: OpenApiDocument, owner: string): void {
  const entries = Object.entries(value);
  if (entries.length === 0) throw fail('invalid-openapi', `${owner} responses must define at least one response.`);
  for (const [status, response] of entries) {
    if (!/^(?:default|[1-5]\d{2}|[1-5][xX]{2})$/.test(status)) {
      throw fail('invalid-openapi', `${owner} response key "${status}" is not a valid status code or range.`);
    }
    if (!isRecord(response)) throw fail('invalid-openapi', `${owner} response "${status}" must be an object.`);
    if (typeof response.$ref !== 'string'
      && (typeof response.description !== 'string' || !response.description.trim())) {
      throw fail('invalid-openapi', `${owner} response "${status}" must define a non-empty description.`);
    }
    if (response.content !== undefined) validateContent(response.content, `${owner} response "${status}" content`);
  }
}

function validateContent(value: unknown, owner: string): void {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    throw fail('invalid-openapi', `${owner} must be a non-empty media-type object.`);
  }
  for (const [mediaType, definition] of Object.entries(value)) {
    if (!isRecord(definition)) {
      throw fail('invalid-openapi', `${owner} media type "${mediaType}" must define an object.`);
    }
  }
}

function validateJsonSchemas(document: OpenApiDocument): void {
  const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
  const components = document.components as OpenApiDocument | undefined;
  try {
    ajv.addSchema({ ...document, $id: schemaId });
    const schemas = (components?.schemas ?? {}) as OpenApiDocument;
    for (const name of Object.keys(schemas)) ajv.compile({ $ref: `${schemaId}#/components/schemas/${name}` });
    validateNestedSchemas(document, ajv);
  } catch (error) {
    throw fail('invalid-openapi', `OpenAPI schema validation failed: ${error instanceof Error ? error.message : String(error)}.`, error);
  }
}

function validateNestedSchemas(document: OpenApiDocument, ajv: Ajv2020): void {
  function visit(value: unknown, pointer: string): void {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${pointer}/${index}`));
      return;
    }
    if (!isRecord(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const childPointer = `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`;
      if (key === 'schema') {
        if (!isRecord(child) && typeof child !== 'boolean') {
          throw new Error(`Invalid schema at ${childPointer}: expected a JSON Schema object or boolean.`);
        }
        if (!ajv.validateSchema(child)) {
          throw new Error(`Invalid schema at ${childPointer}: ${ajv.errorsText(ajv.errors)}.`);
        }
      }
      visit(child, childPointer);
    }
  }

  visit(document, '#');
}

export async function generateOpenApiDocs(options: GenerateOpenApiDocsOptions = {}): Promise<string> {
  const inputPath = resolve(repositoryRoot, options.contractPath ?? canonicalPath);
  const outputPath = resolve(repositoryRoot, options.outputPath ?? 'frontend/public/docs/openapi/index.html');
  const distOutputPath = resolve(repositoryRoot, options.distOutputPath ?? 'dist/docs/openapi/index.html');
  try {
    await Promise.all([rm(outputPath, { force: true }), rm(distOutputPath, { force: true })]);
  } catch (error) {
    throw fail('stale-output-cleanup', 'Could not remove stale generated HTML before validation.', error);
  }

  let source: string;
  try {
    source = await readFile(inputPath, 'utf8');
  } catch (error) {
    const code = isRecord(error) && typeof error.code === 'string' ? error.code : undefined;
    const category = code === 'ENOENT' ? 'missing-input' : 'unreadable-input';
    throw fail(category, `Could not read the canonical OpenAPI source (${code ?? 'filesystem error'}).`, error);
  }

  let document: unknown;
  try {
    const yaml = parseDocument(source, { uniqueKeys: true });
    if (yaml.errors.length > 0) {
      throw new Error(yaml.errors.map((error) => error.message).join('; '));
    }
    document = yaml.toJSON();
  } catch (error) {
    throw fail('invalid-yaml', `The canonical source is not valid YAML: ${error instanceof Error ? error.message : String(error)}.`, error);
  }

  validateOpenApi(document);
  validateLocalReferences(document);
  validateJsonSchemas(document);

  let html: string;
  try {
    html = (options.renderer ?? renderOpenApiDocument)(document);
    if (typeof html !== 'string' || html.trim().length === 0) throw new Error('Renderer returned empty HTML.');
  } catch (error) {
    throw fail('render-error', `Could not render the validated contract: ${error instanceof Error ? error.message : String(error)}.`, error);
  }

  try {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html, 'utf8');
  } catch (error) {
    await Promise.all([rm(outputPath, { force: true }), rm(distOutputPath, { force: true })]);
    throw fail('output-write', 'Could not write the validated documentation page.', error);
  }
  return outputPath;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined;
if (invokedPath === import.meta.url) {
  generateOpenApiDocs().then((output) => {
    console.log(`Generated OpenAPI documentation: ${output}`);
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
