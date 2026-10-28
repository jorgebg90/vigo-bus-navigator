import type { MunicipalArrival } from '../../domain/types';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import { isNumericId, isOpaqueId } from './request-validation';

export function normalizeArrivalPayload(payload: unknown, requestedVitrasaId: string): MunicipalArrival[] {
  if (!isNumericId(requestedVitrasaId)) {
    throw new MunicipalOperationError('identity-unverified', 'Arrival request requires a verified Vitrasa ID');
  }
  if (!isRecord(payload)) throw new MunicipalOperationError('invalid', 'Arrival response envelope was invalid');

  const parada = payload['parada'];
  const estimaciones = payload['estimaciones'];
  if (!Array.isArray(parada) || parada.length !== 1 || !Array.isArray(estimaciones)) {
    throw new MunicipalOperationError('invalid', 'Arrival response was missing its identity or estimate envelope');
  }

  const stop = parada[0];
  if (
    !isRecord(stop)
    || typeof stop['stop_vitrasa'] !== 'number'
    || !Number.isSafeInteger(stop['stop_vitrasa'])
    || stop['stop_vitrasa'] < 0
    || String(stop['stop_vitrasa']) !== requestedVitrasaId
  ) {
    throw new MunicipalOperationError('identity-unverified', 'Arrival response did not match the requested stop');
  }
  if (estimaciones.length > 10000) {
    throw new MunicipalOperationError('oversized', 'Arrival response exceeded the row limit');
  }

  return estimaciones
    .map((estimate, index) => ({ estimate, index }))
    .map(({ estimate, index }) => {
      if (!isRecord(estimate)) throw new MunicipalOperationError('invalid', 'Arrival estimate was invalid');
      const lineCode = estimate['linea'];
      const destination = estimate['ruta'];
      const minutes = estimate['minutos'];
      if (!isOpaqueId(lineCode)) throw new MunicipalOperationError('invalid', 'Arrival line identity was invalid');
      if (
        typeof destination !== 'string'
        || Array.from(destination).length > 2048
        || destination.trim().length === 0
        || !isOpaqueId(destination)
      ) {
        throw new MunicipalOperationError('invalid', 'Arrival destination was invalid');
      }
      if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 0) {
        throw new MunicipalOperationError('invalid', 'Arrival minutes were invalid');
      }
      return {
        index,
        arrival: {
          lineCode,
          destination,
          minutes
        }
      };
    })
    .sort((left, right) => left.arrival.minutes - right.arrival.minutes || left.index - right.index)
    .map(({ arrival }) => arrival);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
