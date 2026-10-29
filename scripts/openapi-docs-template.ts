import { stringify } from 'yaml';

type OpenApiObject = Record<string, unknown>;

const httpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
const sourcePath = 'specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml';
const yamlIndent = 2;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pointerChild(pointer: string, key: string | number): string {
  const token = String(key).replaceAll('~', '~0').replaceAll('/', '~1');
  return `${pointer}/${token}`;
}

function idFor(prefix: string, value: string): string {
  const encoded = encodeURIComponent(value).replaceAll('%', '-').replace(/[^A-Za-z0-9._~-]/g, '-');
  return `${prefix}-${encoded}`;
}

function displayValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

function displayLabel(key: string): string {
  if (key.startsWith('x-')) return `Extension ${key}`;
  const labels: Record<string, string> = {
    operationId: 'Operation ID',
    requestBody: 'Request body',
    parameters: 'Parameters',
    responses: 'Responses',
    schema: 'Schema'
  };
  if (labels[key]) return labels[key];
  if (!/[A-Z]/.test(key)) return key;
  return key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)
    .replace(/^./, (letter) => letter.toUpperCase());
}

function renderValue(
  value: unknown,
  pointer: string,
  document: OpenApiObject,
  key?: string
): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return `<ol class="values" data-contract-pointer="${escapeHtml(pointer)}"></ol>`;
    return `<ol class="values" data-contract-pointer="${escapeHtml(pointer)}">${value.map((item, index) => {
      const itemPointer = pointerChild(pointer, index);
      return `<li data-contract-pointer="${escapeHtml(itemPointer)}">${renderValue(item, itemPointer, document)}</li>`;
    }).join('')}</ol>`;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as OpenApiObject);
    if (entries.length === 0) return `<dl class="fields" data-contract-pointer="${escapeHtml(pointer)}"></dl>`;
    return `<dl class="fields" data-contract-pointer="${escapeHtml(pointer)}">${entries.map(([childKey, childValue]) => {
      const childPointer = pointerChild(pointer, childKey);
      return `<div class="field"><dt data-contract-pointer="${escapeHtml(childPointer)}">${escapeHtml(displayLabel(childKey))}</dt><dd>${renderValue(childValue, childPointer, document, childKey)}</dd></div>`;
    }).join('')}</dl>`;
  }

  const text = escapeHtml(displayValue(value));
  if (key === '$ref' && typeof value === 'string' && value.startsWith('#/components/schemas/')) {
    const name = decodeURIComponent(value.slice('#/components/schemas/'.length))
      .replaceAll('~1', '/')
      .replaceAll('~0', '~');
    const schemas = (document.components as OpenApiObject | undefined)?.schemas as OpenApiObject | undefined;
    if (schemas && Object.hasOwn(schemas, name)) {
      return `<span class="contract-value" data-contract-pointer="${escapeHtml(pointer)}"><a href="#${escapeHtml(idFor('schema', name))}">${text}</a></span>`;
    }
  }
  return `<span class="contract-value" data-contract-pointer="${escapeHtml(pointer)}">${text}</span>`;
}

function renderFields(value: unknown, pointer: string, document: OpenApiObject): string {
  return renderValue(value, pointer, document);
}

function operationEntries(document: OpenApiObject): Array<{
  method: string;
  path: string;
  pointer: string;
  pathItem: OpenApiObject;
  operation: OpenApiObject;
  pathIndex: number;
}> {
  const paths = document.paths as OpenApiObject;
  return Object.entries(paths).flatMap(([path, rawPathItem], pathIndex) => {
    const pathItem = rawPathItem as OpenApiObject;
    return httpMethods.flatMap((method) => {
      const operation = pathItem[method];
      if (operation === undefined) return [];
      return [{
        method,
        path,
        pointer: pointerChild(pointerChild('#/paths', path), method),
        pathItem,
        operation: operation as OpenApiObject,
        pathIndex
      }];
    });
  });
}

function schemaEntries(document: OpenApiObject): Array<[string, unknown]> {
  const components = document.components as OpenApiObject | undefined;
  const schemas = components?.schemas as OpenApiObject | undefined;
  return Object.entries(schemas ?? {});
}

function renderNavigation(operations: ReturnType<typeof operationEntries>, schemas: Array<[string, unknown]>): string {
  const operationIndex = operations.length
    ? `<p class="index-heading">Operations</p><ul>${operations.map(({ method, path, pointer }) =>
      `<li data-contract-pointer="${escapeHtml(pointer)}"><a href="#${escapeHtml(idFor('operation', `${method}-${path}`))}">${escapeHtml(`${method.toUpperCase()} ${path}`)}</a></li>`
    ).join('')}</ul>`
    : '';
  const schemaIndex = schemas.length
    ? `<p class="index-heading">Schemas</p><ul>${schemas.map(([name]) =>
      `<li><a href="#${escapeHtml(idFor('schema', name))}">${escapeHtml(name)}</a></li>`
    ).join('')}</ul>`
    : '';
  return `<nav aria-label="On this page">
    <h2>On this page</h2>
    ${operationIndex}
    ${schemaIndex}
  </nav>`;
}

function renderOperations(document: OpenApiObject): string {
  const paths = document.paths as OpenApiObject;
  const entries = operationEntries(document);
  if (entries.length === 0) return '<p>No operations are defined in this contract.</p>';
  const groups = Object.entries(paths).map(([path, rawPathItem]) => {
    const pathPointer = pointerChild('#/paths', path);
    const pathItem = rawPathItem as OpenApiObject;
    const pathMetadata = Object.fromEntries(
      Object.entries(pathItem).filter(([key]) => !httpMethods.includes(key as typeof httpMethods[number]))
    );
    const operations = entries.filter((entry) => entry.path === path).map(({ method, pointer, operation }) => {
      const operationId = idFor('operation', `${method}-${path}`);
      const summary = typeof operation.summary === 'string'
        ? `<p class="operation-summary">${escapeHtml(operation.summary)}</p>`
        : '';
      return `<article class="operation method-${escapeHtml(method)}" id="${escapeHtml(operationId)}" data-contract-pointer="${escapeHtml(pointer)}">
        <h3><span class="method-badge">${escapeHtml(method.toUpperCase())}</span><code>${escapeHtml(path)}</code></h3>
        ${summary}
        ${renderFields(operation, pointer, document)}
      </article>`;
    }).join('');
    return `<section class="path-group" data-contract-pointer="${escapeHtml(pathPointer)}">
      <p class="path-heading"><strong>Path</strong> <code>${escapeHtml(path)}</code></p>
      ${Object.keys(pathMetadata).length ? `<h4>Path-level parameters and metadata</h4>${renderFields(pathMetadata, pathPointer, document)}` : ''}
      ${operations}
    </section>`;
  }).join('');
  return groups;
}

function renderSchemas(document: OpenApiObject): string {
  const components = document.components as OpenApiObject | undefined;
  const schemas = schemaEntries(document);
  const entries = schemas.length
    ? schemas.map(([name, schema]) => {
      const pointer = pointerChild('#/components/schemas', name);
      return `<article class="schema" id="${escapeHtml(idFor('schema', name))}" data-contract-pointer="${escapeHtml(pointer)}">
        <h3>${escapeHtml(name)}</h3>
        ${renderFields(schema, pointer, document)}
      </article>`;
    }).join('')
    : '<p>No component schemas are defined in this contract.</p>';
  const otherComponents = components
    ? Object.fromEntries(Object.entries(components).filter(([key]) => key !== 'schemas'))
    : {};
  const otherSections = Object.keys(otherComponents).length
    ? `<section aria-labelledby="other-components-heading"><h3 id="other-components-heading">Other components</h3>${renderFields(otherComponents, '#/components', document)}</section>`
    : '';
  return `<div data-contract-pointer="#/components">${entries}${otherSections}</div>`;
}

export function renderOpenApiDocument(document: OpenApiObject, sourceText?: string): string {
  const info = document.info as OpenApiObject;
  const operations = operationEntries(document);
  const schemas = schemaEntries(document);
  const infoTitle = typeof info.title === 'string' ? info.title : 'OpenAPI contract';
  const source = sourceText ?? stringify(document, { indent: yamlIndent });
  const infoPointer = renderFields(info, '#/info', document);
  const rootMetadata = Object.fromEntries(
    Object.entries(document).filter(([key]) => key !== 'info' && key !== 'paths' && key !== 'components')
  );
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(infoTitle)} — OpenAPI documentation</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #332321; background: #f3f5f7; line-height: 1.5; }
    * { box-sizing: border-box; }
    body { margin: 0; overflow: hidden; overflow-wrap: anywhere; }
    a { color: #376e9b; text-decoration-thickness: .1em; text-underline-offset: .15em; }
    a:hover { color: #164b78; }
    a:focus-visible, button:focus-visible { outline: 3px solid #9b2f3b; outline-offset: 2px; }
    .source-pane:focus-visible, .source-code:focus-visible { outline: 3px solid #85b849; outline-offset: -3px; }
    .skip-link { position: fixed; inset-inline-start: .5rem; inset-block-start: .5rem; z-index: 5; padding: .65rem .8rem; transform: translateY(-180%); background: #fff; border: 2px solid #7d2230; }
    .skip-link:focus { transform: translateY(0); }
    .app-bar { display: flex; align-items: center; gap: 1rem; min-height: 3.5rem; padding: .45rem 1rem; background: #1b1b1b; color: #fff; border-bottom: 3px solid #85b849; }
    .brand { color: #fff; font-weight: 700; text-decoration: none; }
    .app-bar-label { color: #d7d7d7; font-size: .9rem; }
    .workspace { display: grid; grid-template-columns: minmax(19rem, .88fr) minmax(0, 1.12fr); height: calc(100dvh - 3.5rem); min-height: 0; }
    .source-pane, .docs-pane { min-width: 0; min-height: 0; overflow: auto; }
    .source-pane { background: #1e1e1e; color: #d4d4d4; border-right: 1px solid #343434; }
    .pane-heading { position: sticky; inset-block-start: 0; z-index: 2; display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin: 0; padding: .75rem 1rem; color: #f4f4f4; background: #252526; border-bottom: 1px solid #3c3c3c; font-size: .9rem; }
    .pane-heading small { color: #a7a7a7; font-weight: 400; }
    .source-code { margin: 0; padding: 1rem 1.25rem 2rem; color: #d4d4d4; font: .82rem/1.65 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; tab-size: 2; white-space: pre; overflow-wrap: normal; }
    .docs-pane { background: #fff; }
    .docs-page { max-width: 68rem; margin-inline: auto; padding: 1.25rem clamp(1rem, 3vw, 2.25rem) 3rem; }
    .docs-intro { margin: .4rem 0 1.25rem; color: #4b5560; }
    .contract-info { padding: .25rem .9rem; border: 1px solid #d5d9de; background: #f8fafb; }
    header, nav, section, article { min-width: 0; }
    .docs-header { margin-bottom: 1rem; }
    nav { border: 1px solid #d5d9de; border-radius: .25rem; padding: .7rem 1rem; margin-block: 1rem; background: #f8fafb; }
    nav h2 { margin: .1rem 0 .4rem; font-size: 1rem; }
    nav ul { display: flex; flex-wrap: wrap; gap: .25rem .65rem; list-style: none; padding: 0; margin: .15rem 0 .5rem; }
    .index-heading { margin-block: .5rem .15rem; font-weight: 650; }
    nav li { min-width: 0; }
    nav a, .brand, .contract-value a { display: inline-block; min-height: 44px; padding: .55rem .4rem; }
    .path-group { margin-block: 1rem; }
    .operation, .schema { border: 1px solid #c8d7e2; border-radius: .25rem; margin-block: .7rem; background: #fbfcfd; overflow: clip; }
    .operation h3 { display: flex; align-items: center; gap: .8rem; margin: 0; padding: .75rem .85rem; background: #f1f7fa; border-bottom: 1px solid #c8d7e2; }
    .operation h3 code { font-size: 1rem; }
    .operation-summary { margin: .6rem .9rem; color: #42505b; }
    .method-badge { flex: 0 0 4.25rem; padding: .2rem .35rem; border-radius: .2rem; text-align: center; background: #61affe; color: #102a3c; font: 700 .78rem/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .method-post .method-badge { background: #49cc90; }
    .method-put .method-badge { background: #fca130; color: #32220d; }
    .method-delete .method-badge { background: #f93e3e; color: #fff; }
    .method-patch .method-badge { background: #50e3c2; }
    .method-head .method-badge, .method-options .method-badge { background: #9012fe; color: #fff; }
    .operation > .fields, .schema > .fields, .schema > h3 { margin-inline: .9rem; }
    .path-heading { display: none; }
    .schema { padding: .2rem .9rem .8rem; }
    .schema h3 { margin-block: .75rem; }
    .fields { margin: 0; }
    .field { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 3fr); gap: .25rem 1rem; border-bottom: 1px solid #e6dddb; padding-block: .55rem; }
    .field > dt, .field > dd { min-width: 0; overflow-wrap: anywhere; }
    dt { font-weight: 650; }
    dd { min-width: 0; margin: 0; }
    dd > .fields, dd > .values { margin-block: .4rem; }
    .values { padding-inline-start: 1.5rem; }
    .contract-value { white-space: pre-wrap; overflow-wrap: anywhere; }
    h1, h2, h3, h4 { line-height: 1.25; overflow-wrap: anywhere; }
    h1 { margin-block: .5rem; font-size: clamp(1.5rem, 3vw, 2rem); }
    h2 { margin-top: 1.5rem; }
    h3 { margin-top: .9rem; }
    footer { border-top: 1px solid #d5d9de; margin-top: 2rem; padding-top: 1rem; color: #5a4947; }
    @media (max-width: 58rem) {
      body { overflow: auto; }
      .workspace { grid-template-columns: minmax(0, 1fr); height: auto; }
      .source-pane, .docs-pane { overflow: visible; }
      .source-pane { max-height: 42vh; border-right: 0; border-bottom: 2px solid #343434; }
      .source-code { max-height: calc(42vh - 3rem); overflow: auto; }
      .docs-page { padding-top: 1rem; }
    }
    @media (max-width: 36rem) {
      .app-bar { min-height: 3.25rem; }
      .app-bar-label { font-size: .8rem; }
      .source-pane { max-height: 35vh; }
      .source-code { max-height: calc(35vh - 3rem); padding-inline: .8rem; }
      .workspace { min-height: calc(100dvh - 3.25rem); }
      .field { grid-template-columns: minmax(0, 1fr); gap: .1rem; }
      .operation h3 { align-items: flex-start; gap: .5rem; }
      .method-badge { flex-basis: 3.8rem; }
    }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; } }
  </style>
</head>
<body>
  <a class="skip-link" href="#contract-content">Skip to rendered documentation</a>
  <header class="app-bar">
    <a class="brand" href="../../">Vigo Bus Navigator</a>
    <span class="app-bar-label">OpenAPI Editor</span>
  </header>
  <div class="workspace">
    <aside class="source-pane" aria-label="OpenAPI source, read only" tabindex="0">
      <div class="pane-heading"><strong>Source</strong><small>YAML · read only</small></div>
      <pre class="source-code" tabindex="0" aria-label="Canonical OpenAPI YAML"><code>${escapeHtml(source)}</code></pre>
    </aside>
    <main class="docs-pane" id="contract-content">
      <div class="docs-page">
      <header class="docs-header">
      <h1>Municipal transit API contract</h1>
      <p class="docs-intro">Static documentation generated from the canonical municipal transit contract. This page documents a source contract; it is not a hosted API, backend, or transit proxy.</p>
      </header>
      <section class="contract-info" aria-labelledby="contract-info-heading">
        <h2 id="contract-info-heading">Contract information</h2>
        ${infoPointer}
        ${Object.keys(rootMetadata).length ? `<h3>Contract metadata and extensions</h3>${renderFields(rootMetadata, '#', document)}` : ''}
      </section>
      ${renderNavigation(operations, schemas)}
      <section aria-labelledby="operations-heading" data-contract-pointer="#/paths">
        <h2 id="operations-heading">Operations</h2>
        ${renderOperations(document)}
      </section>
      <section aria-labelledby="schemas-heading" data-contract-pointer="#/components/schemas">
        <h2 id="schemas-heading">Component schemas</h2>
        ${renderSchemas(document)}
      </section>
      <footer>
      <p>Canonical source: <code>${escapeHtml(sourcePath)}</code></p>
      <p><a href="../../">Return to Vigo Bus Navigator</a></p>
      </footer>
      </div>
    </main>
  </div>
</body>
</html>
`;
}
