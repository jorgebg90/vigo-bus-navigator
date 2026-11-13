import { stringify } from 'yaml';
import { openApiContracts } from './openapi-contracts';

type OpenApiObject = Record<string, unknown>;

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function renderOpenApiDocument(
  document: OpenApiObject,
  sourceText?: string,
  sourcePath: string = openApiContracts[0].path
): string {
  const info = document.info as OpenApiObject;
  const title = typeof info.title === 'string' ? info.title : 'OpenAPI contract';
  const pageTitle = openApiContracts.find((contract) => contract.path === sourcePath)?.title ?? title;
  const source = sourceText ?? stringify(document);
  const spec = JSON.stringify(document).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  const mappings = Object.fromEntries(Object.entries(document).filter(([key]) => key.startsWith('x-')));
  const servers = Array.isArray(document.servers) ? document.servers : [];
  const serverLabels = servers.flatMap((server: unknown) => (
    typeof server === 'object' && server !== null && 'url' in server && typeof server.url === 'string'
      ? [`<code>${escapeHtml(server.url)}</code>`] : []
  )).join(', ');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)} — OpenAPI documentation</title>
  <link rel="stylesheet" href="./swagger-ui.css">
  <style>
    :root { font-family: system-ui, sans-serif; color: #242424; background: #fafafa; line-height: 1.5; color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; overflow-wrap: anywhere; }
    a { color: #245c88; }
    a:focus-visible, button:focus-visible, summary:focus-visible, input:focus-visible { outline: 3px solid #9b2f3b; outline-offset: 3px; }
    .skip-link { position: absolute; top: .5rem; left: .5rem; padding: .75rem; background: white; transform: translateY(-200%); z-index: 10; }
    .skip-link:focus { transform: none; }
    .app-bar { background: #1b1b1b; padding: .75rem max(1rem, calc((100% - 1460px) / 2)); color: white; }
    .brand { display: inline-block; color: white; font-weight: 700; min-height: 44px; padding: .5rem 0; text-decoration: none; }
    #contract-content { max-width: 1500px; margin: auto; padding: 1rem 20px; min-width: 0; }
    h1 { font-size: clamp(1.5rem, 3vw, 2rem); margin-block: .5rem; }
    .intro, footer { color: #454545; }
    .contracts { padding: .75rem 1rem; border: 1px solid #ccc; border-radius: 4px; background: white; }
    .contracts ul { display: flex; flex-wrap: wrap; gap: .25rem 1rem; list-style: none; padding: 0; margin: 0; }
    .contracts a { display: inline-block; padding: .65rem .25rem; min-height: 44px; }
    .contracts a[aria-current] { font-weight: 700; color: #242424; text-decoration-thickness: 3px; }
    details.source, details.mappings { background: white; border: 1px solid #ccc; border-radius: 4px; margin-block: 1rem; }
    summary { cursor: pointer; padding: .75rem; min-height: 44px; font-weight: 600; }
    pre { max-height: 55vh; overflow: auto; padding: 1rem; margin: 0; background: #202020; color: #f1f1f1; font-size: .85rem; }
    .swagger-ui .wrapper { padding-inline: 0; }
    .swagger-ui .info { margin-block: 1.5rem; }
    .swagger-ui .info .title { font-size: 1.5rem; }
    .swagger-ui a, .swagger-ui .info a { color: #245c88; }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #245c88; }
    .swagger-ui .json-schema-2020-12-expand-deep-button { color: #454545; }
    .swagger-ui .json-schema-2020-12__title { color: #242424; }
    .swagger-ui .json-schema-2020-12__constraint { color: #242424; background-color: #eef2f5; }
    .swagger-ui .opblock .opblock-summary-path { min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
    .swagger-ui .opblock .opblock-summary { flex-wrap: wrap; }
    .swagger-ui .opblock .opblock-summary-description { min-width: 0; }
    .swagger-ui .opblock-body, .swagger-ui .model-box { overflow-x: auto; }
    .swagger-ui .opblock-control-arrow, .swagger-ui .expand-operation, .swagger-ui .model-box-control { min-width: 44px; min-height: 44px; }
    footer { border-top: 1px solid #ccc; margin-top: 2rem; padding-top: 1rem; }
    footer code, .servers-readonly code { overflow-wrap: anywhere; word-break: break-word; white-space: normal; }
    @media (max-width: 600px) {
      #contract-content { padding-inline: .75rem; }
      .contracts ul { display: block; }
      .swagger-ui .opblock .opblock-summary-path { max-width: calc(100% - 90px); font-size: .85rem; }
      .swagger-ui .opblock .opblock-summary-description { flex-basis: 100%; padding: .5rem 0; }
      .swagger-ui .opblock .opblock-summary-operation-id { max-width: 100%; overflow-wrap: anywhere; }
      .swagger-ui table { display: block; overflow-x: auto; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#contract-content">Skip to documentation</a>
  <header class="app-bar"><a class="brand" href="../../">Vigo Bus Navigator</a> · Swagger UI</header>
  <div id="contract-content" tabindex="-1">
    <h1>${escapeHtml(pageTitle)}</h1>
    <p class="intro">External source contracts and in-process application models. Read-only documentation:
    requests run through application ports and adapters, not this viewer. No hosted API or backend is introduced.</p>
    <nav class="contracts" aria-label="Application API contracts"><ul>${openApiContracts.map((contract) =>
      `<li><a href="./${escapeHtml(contract.page)}"${contract.path === sourcePath ? ' aria-current="page"' : ''}>${escapeHtml(contract.title)}</a></li>`
    ).join('')}</ul></nav>
    <p class="servers-readonly">Source servers (read only): ${serverLabels || 'See operation-level servers in the contract.'}</p>
    <details class="source"><summary>OpenAPI YAML · read only</summary><pre tabindex="0" aria-label="Canonical OpenAPI YAML"><code>${escapeHtml(source)}</code></pre></details>
    <details class="mappings"><summary>Architecture and source policies</summary><pre tabindex="0" aria-label="Hexagonal mappings and source policies">${escapeHtml(stringify(mappings))}</pre></details>
    <p id="viewer-status" role="status">Loading interactive documentation…</p>
    <div id="swagger-ui"></div>
    <noscript><p>JavaScript is required for Swagger UI. The complete read-only YAML is available above.</p></noscript>
    <footer><p>Canonical source: <code>${escapeHtml(sourcePath)}</code></p><p><a href="../../">Return to Vigo Bus Navigator</a></p></footer>
  </div>
  <script id="openapi-spec" type="application/json">${spec}</script>
  <script src="./swagger-ui-bundle.js"></script>
  <script>
    document.querySelector('.skip-link').addEventListener('click', function (event) {
      event.preventDefault();
      document.getElementById('contract-content').focus();
    });
    try {
      if (typeof SwaggerUIBundle !== 'function') throw new Error('Swagger UI assets could not be loaded.');
      SwaggerUIBundle({
        spec: JSON.parse(document.getElementById('openapi-spec').textContent),
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        plugins: [function () { return { components: {
          Servers: function () { return null; },
          ServersContainer: function () { return null; }
        } }; }],
        layout: 'BaseLayout',
        deepLinking: false,
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        displayOperationId: true,
        showExtensions: true,
        showCommonExtensions: true,
        supportedSubmitMethods: [],
        validatorUrl: null,
        persistAuthorization: false,
        withCredentials: false,
        onComplete: function () { document.getElementById('viewer-status').textContent = ''; }
      });
    } catch (error) {
      document.getElementById('viewer-status').textContent = 'Interactive documentation is unavailable. Open the read-only YAML above.';
      console.error('OpenAPI viewer failed to initialize.', error);
    }
  </script>
</body>
</html>
`;
}
