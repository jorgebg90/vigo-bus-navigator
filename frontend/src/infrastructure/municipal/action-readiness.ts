import type { MunicipalProfile } from '../config';
import type { MunicipalAction } from './request-builder';

const browserSourceActions = new Set<MunicipalAction>([
  'TRANSPORTE_LINEAS_ES',
  'TRANSPORTE_LINEAS_GA',
  'TRANSPORTE_LINEAS_SERVICIOS_ES',
  'TRANSPORTE_LINEAS_SERVICIOS_GA',
  'TRANSPORTE_PARADA_ID',
  'TRANSPORTE_LINEAS_PARADA',
  'TRANSPORTE_PARADAS',
  'TRANSPORTE-ESTIMACION-PARADA'
]);

/**
 * Actions mirrored from the official app: any identifier accepted by the request
 * builder (public line code, source shape ID or source trip ID) is allowed in live profiles.
 */
const liveOnlineCatalogActions = new Set<MunicipalAction>([
  'TRANSPORTE_LINEA_HORARIOS_EXTEND',
  'TRANSPORTE_LINEA_GEOJSON',
  'TRANSPORTE_PARADAS_TRIP'
]);

const scopedCandidateParameters: Partial<Record<MunicipalAction, readonly Readonly<Record<string, string>>[]>> = {
  TRANSPORTE_LINEA_INFO_PARADA: [{ stop_id: '2789', linea: 'A' }]
};

export function isMunicipalActionEnabled(
  action: MunicipalAction,
  profile: MunicipalProfile,
  parameters?: Readonly<Record<string, unknown>>
): boolean {
  if (profile === 'fixture') return true;
  if (browserSourceActions.has(action)) return true;
  if ((profile !== 'local-live' && profile !== 'production') || !parameters) return false;
  if (liveOnlineCatalogActions.has(action)) return true;
  const allowedParameters = scopedCandidateParameters[action];
  if (!allowedParameters) return false;
  return allowedParameters.some((allowed) => (
    Object.keys(allowed).length === Object.keys(parameters).length
    && Object.entries(allowed).every(([key, value]) => parameters[key] === value)
  ));
}
