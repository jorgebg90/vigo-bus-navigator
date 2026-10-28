const endpoint = 'https://datos.vigo.org/vci_api_app/api2.jsp';
const result = document.querySelector('#result');
const stopIdInput = document.querySelector('#stop-id');

function displayPayload(text, contentType) {
  if (contentType.includes('json')) {
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch { /* Keep raw body for non-JSON errors. */ }
  }
  return text.slice(0, 4000);
}

async function runTest(label, method, params) {
  const stopId = stopIdInput.value.trim();
  if (!/^\d{1,6}$/.test(stopId)) {
    result.textContent = 'El ID debe contener entre 1 y 6 dígitos.';
    return;
  }

  const values = { ...params, id: stopId };
  const url = new URL(endpoint);
  const options = { method, mode: 'cors', credentials: 'omit', redirect: 'follow' };
  if (method === 'GET') {
    for (const [key, value] of Object.entries(values)) url.searchParams.set(key, value);
  } else {
    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.set(key, value);
    options.body = form;
  }

  result.textContent = `${label}\n${method} ${url.href}\nEnviando…`;
  const startedAt = performance.now();
  try {
    const response = await fetch(url, options);
    const body = await response.text();
    const elapsedMs = Math.round(performance.now() - startedAt);
    result.textContent = [
      `${label}`,
      `${method} ${url.href}`,
      `HTTP ${response.status} ${response.statusText}`,
      `Content-Type: ${response.headers.get('content-type') ?? '(ausente)'}`,
      `Duración: ${elapsedMs} ms`,
      '',
      displayPayload(body, response.headers.get('content-type') ?? '')
    ].join('\n');
  } catch (error) {
    result.textContent = [
      `${label}`,
      `${method} ${url.href}`,
      `Fetch rechazado tras ${Math.round(performance.now() - startedAt)} ms.`,
      `${error instanceof Error ? error.name + ': ' + error.message : String(error)}`,
      '',
      'Un TypeError de fetch suele indicar que CORS impide leer la respuesta. Revisa Network/Console para distinguirlo de un error del servidor.'
    ].join('\n');
  }
}

document.querySelector('[data-test="get-stop"]').addEventListener('click', () =>
  runTest('Detalle de parada, formato GET de la app', 'GET', { tipo: 'TRANSPORTE_PARADA_ID' }));

document.querySelector('[data-test="get-arrivals"]').addEventListener('click', () =>
  runTest('Estimaciones de llegada, GET con tipo correcto', 'GET', { tipo: 'TRANSPORTE-ESTIMACION-PARADA', ttl: '5' }));

document.querySelector('[data-test="post-stop"]').addEventListener('click', () =>
  runTest('Detalle de parada, POST multipart', 'POST', { tipo: 'TRANSPORTE_PARADA_ID' }));

document.querySelector('[data-test="post-arrivals"]').addEventListener('click', () =>
  runTest('Estimaciones de llegada, POST multipart', 'POST', { tipo: 'TRANSPORTE-ESTIMACION-PARADA', ttl: '5' }));