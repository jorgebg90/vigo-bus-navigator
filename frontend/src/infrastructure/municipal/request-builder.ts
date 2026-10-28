import { requireNumericId, requireOpaqueId } from './request-validation';

export const MUNICIPAL_ACTIONS = [
  'TRANSPORTE_LINEAS_ES',
  'TRANSPORTE_LINEAS_GA',
  'TRANSPORTE_LINEAS_SERVICIOS_ES',
  'TRANSPORTE_LINEAS_SERVICIOS_GA',
  'TRANSPORTE_PARADA_ID',
  'TRANSPORTE_LINEAS_PARADA',
  'TRANSPORTE_PARADAS',
  'TRANSPORTE-ESTIMACION-PARADA',
  'TRANSPORTE_LINEA_HORARIOS_EXTEND',
  'TRANSPORTE_LINEA_GEOJSON',
  'TRANSPORTE_PARADAS_TRIP',
  'TRANSPORTE_LINEA_INFO_PARADA'
] as const;

export type MunicipalAction = typeof MUNICIPAL_ACTIONS[number];

type ParameterRule = 'numeric-id' | 'opaque-id' | 'day';

interface ActionRule {
  parameters: Readonly<Record<string, ParameterRule>>;
  constants?: Readonly<Record<string, string>>;
}

const actionRules: Readonly<Record<MunicipalAction, ActionRule>> = {
  TRANSPORTE_LINEAS_ES: { parameters: {} },
  TRANSPORTE_LINEAS_GA: { parameters: {} },
  TRANSPORTE_LINEAS_SERVICIOS_ES: { parameters: {} },
  TRANSPORTE_LINEAS_SERVICIOS_GA: { parameters: {} },
  TRANSPORTE_PARADA_ID: { parameters: { id: 'numeric-id' } },
  TRANSPORTE_LINEAS_PARADA: { parameters: { id: 'numeric-id' } },
  TRANSPORTE_PARADAS: { parameters: {} },
  'TRANSPORTE-ESTIMACION-PARADA': {
    parameters: { id: 'numeric-id' },
    constants: { ttl: '5' }
  },
  TRANSPORTE_LINEA_HORARIOS_EXTEND: {
    parameters: { id: 'opaque-id', dia: 'day' }
  },
  TRANSPORTE_LINEA_GEOJSON: { parameters: { id: 'opaque-id' } },
  TRANSPORTE_PARADAS_TRIP: { parameters: { id: 'opaque-id' } },
  TRANSPORTE_LINEA_INFO_PARADA: {
    parameters: { stop_id: 'numeric-id', linea: 'opaque-id' },
    constants: { min: '0' }
  }
};

const municipalEndpoint = 'https://datos.vigo.org/vci_api_app/api2.jsp';

export function buildMunicipalRequest(
  action: string,
  parameters: Readonly<Record<string, unknown>> = {}
): URL {
  if (!Object.hasOwn(actionRules, action)) throw new TypeError('Unknown municipal action');
  if (typeof parameters !== 'object' || parameters === null || Array.isArray(parameters)) {
    throw new TypeError('Invalid municipal parameters');
  }

  const rule = actionRules[action as MunicipalAction];
  const suppliedKeys = Object.keys(parameters);
  const unknownKey = suppliedKeys.find((key) => !Object.hasOwn(rule.parameters, key));
  if (unknownKey) throw new TypeError('Unknown municipal parameter');

  for (const [name, parameterRule] of Object.entries(rule.parameters)) {
    const value = parameters[name];
    if (value === undefined) throw new TypeError(`Missing ${name}`);
    if (parameterRule === 'numeric-id') requireNumericId(value, name);
    if (parameterRule === 'opaque-id') requireOpaqueId(value, name);
    if (parameterRule === 'day' && (typeof value !== 'string' || !['0', '1', '6'].includes(value))) {
      throw new TypeError('Invalid dia');
    }
  }

  const url = new URL(municipalEndpoint);
  url.searchParams.set('tipo', action);
  for (const [name, value] of Object.entries(parameters)) {
    if (typeof value !== 'string') throw new TypeError(`Invalid ${name}`);
    url.searchParams.set(name, value);
  }
  for (const [name, value] of Object.entries(rule.constants ?? {})) {
    url.searchParams.set(name, value);
  }
  return url;
}
