type OpenApiObject = Record<string, unknown>;

const httpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
const sourcePath = 'specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml';

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
      return `<article class="operation" id="${escapeHtml(operationId)}" data-contract-pointer="${escapeHtml(pointer)}">
        <h3>${escapeHtml(`${method.toUpperCase()} ${path}`)}</h3>
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

export function renderOpenApiDocument(document: OpenApiObject): string {
  const info = document.info as OpenApiObject;
  const operations = operationEntries(document);
  const schemas = schemaEntries(document);
  const infoTitle = typeof info.title === 'string' ? info.title : 'OpenAPI contract';
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
    :root { color-scheme: light; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #332321; background: #fff; line-height: 1.6; }
    * { box-sizing: border-box; }
    body { margin: 0; overflow-wrap: anywhere; }
    .page { width: min(100% - 2rem, 76ch); margin-inline: auto; padding-block: 1.5rem 3rem; }
    a { color: #9b2f3b; text-decoration-thickness: .12em; text-underline-offset: .15em; }
    a:hover { color: #541723; }
    a:focus-visible { outline: 3px solid #7d2230; outline-offset: 2px; }
    .skip-link { position: absolute; inset-inline-start: .5rem; inset-block-start: .5rem; z-index: 1; padding: .65rem .8rem; transform: translateY(-180%); background: #fff; border: 2px solid #7d2230; }
    .skip-link:focus { transform: translateY(0); }
    header, nav, section, article { min-width: 0; }
    header { border-bottom: 1px solid #8a6f6b; margin-bottom: 1.5rem; padding-bottom: 1rem; }
    nav { border: 1px solid #8a6f6b; padding: .75rem 1rem; margin-block: 1.5rem; }
    nav ul { list-style: none; padding: 0; margin: .25rem 0 1rem; }
    .index-heading { margin-block: .75rem .25rem; font-weight: 650; }
    nav li { margin-block: .2rem; }
    nav a, .home-link, .contract-value a { display: inline-block; min-height: 44px; padding: .55rem .4rem; }
    .path-group, .operation, .schema { border-top: 1px solid #8a6f6b; margin-block: 1.25rem; padding-top: .75rem; }
    .fields { margin: 0; }
    .field { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 3fr); gap: .25rem 1rem; border-bottom: 1px solid #e6dddb; padding-block: .55rem; }
    .field > dt, .field > dd { min-width: 0; overflow-wrap: anywhere; }
    dt { font-weight: 650; }
    dd { min-width: 0; margin: 0; }
    dd > .fields, dd > .values { margin-block: .4rem; }
    .values { padding-inline-start: 1.5rem; }
    .contract-value { white-space: pre-wrap; overflow-wrap: anywhere; }
    h1, h2, h3, h4 { line-height: 1.25; overflow-wrap: anywhere; }
    h1 { font-size: clamp(1.7rem, 4vw, 2.4rem); }
    h2 { margin-top: 2rem; }
    h3 { margin-top: 1.25rem; }
    footer { border-top: 1px solid #8a6f6b; margin-top: 2rem; padding-top: 1rem; color: #5a4947; }
    @media (max-width: 36rem) { .page { width: min(100% - 1.25rem, 76ch); padding-top: .75rem; } .field { grid-template-columns: minmax(0, 1fr); gap: .1rem; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; } }
  </style>
</head>
<body>
  <a class="skip-link" href="#contract-content">Skip to contract content</a>
  <div class="page">
    <header>
      <a class="home-link" href="../../">Vigo Bus Navigator</a>
      <p>Static documentation generated from the canonical municipal transit contract. This page documents a source contract; it is not a hosted API, backend, or transit proxy.</p>
    </header>
    <main id="contract-content">
      <h1>Municipal transit API contract</h1>
      <section aria-labelledby="contract-info-heading">
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
    </main>
    <footer>
      <p>Canonical source: <code>${escapeHtml(sourcePath)}</code></p>
      <p><a href="../../">Return to Vigo Bus Navigator</a></p>
    </footer>
  </div>
</body>
</html>
`;
}
