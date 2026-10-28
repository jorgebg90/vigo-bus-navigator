import { MunicipalOperationError } from '../../domain/municipal-failures';
import { buildMunicipalRequest, MUNICIPAL_ACTIONS, type MunicipalAction } from './request-builder';

const endpointOrigin = 'https://datos.vigo.org';
const endpointPath = '/vci_api_app/api2.jsp';

export class MunicipalFixtureTransport {
  constructor(private readonly fixtures: Partial<Record<MunicipalAction, Uint8Array>>) {}

  readonly fetcher: typeof fetch = async (input, init) => {
    const requestUrl = input instanceof Request
      ? new URL(input.url)
      : input instanceof URL
        ? input
        : new URL(input);
    if (requestUrl.origin !== endpointOrigin || requestUrl.pathname !== endpointPath) {
      throw new MunicipalOperationError('invalid', 'Synthetic request did not match the fixed municipal endpoint');
    }

    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    if (method !== 'GET') throw new MunicipalOperationError('invalid', 'Synthetic transport supports GET only');

    const action = requestUrl.searchParams.get('tipo');
    if (!action || !MUNICIPAL_ACTIONS.includes(action as MunicipalAction)) {
      throw new MunicipalOperationError('invalid', 'Synthetic request used an unknown action');
    }

    const suppliedParameters = Object.fromEntries(
      [...requestUrl.searchParams.entries()].filter(([name]) => !['tipo', 'ttl', 'min'].includes(name))
    );
    const canonicalUrl = buildMunicipalRequest(action, suppliedParameters);
    if (canonicalUrl.href !== requestUrl.href) {
      throw new MunicipalOperationError('invalid', 'Synthetic request parameters were not canonical');
    }

    const bytes = this.fixtures[action as MunicipalAction];
    if (!bytes) throw new MunicipalOperationError('invalid', 'No synthetic fixture is registered for this action');

    let responseBytes = bytes.slice();
    if (action === 'TRANSPORTE-ESTIMACION-PARADA') {
      const requestId = requestUrl.searchParams.get('id');
      if (!requestId || !/^[0-9]{1,12}$/.test(requestId)) {
        throw new MunicipalOperationError('invalid', 'Synthetic arrival request did not include a valid stop ID');
      }
      const payload = JSON.parse(new TextDecoder().decode(responseBytes)) as {
        parada?: Array<Record<string, unknown>>;
      };
      if (payload.parada?.length === 1 && typeof payload.parada[0]?.stop_vitrasa === 'number') {
        payload.parada[0].stop_vitrasa = Number(requestId);
        responseBytes = new TextEncoder().encode(JSON.stringify(payload));
      }
    }

    return new Response(responseBytes, {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  };
}
