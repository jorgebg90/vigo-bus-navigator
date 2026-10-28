/**
 * Application-facing wire types for the real-time arrivals contract v2.
 * Contract: specs/002-realtime-bus-api/contracts/realtime-arrivals.openapi.yaml
 */

export type DataStatus = 'current' | 'stale' | 'empty';

export interface Arrival {
  lineCode: string;
  destination: string;
  minutes: number;
  eta: string;
}

export interface NetworkStop {
  id: string;
  code: string;
  municipalCode: string | null;
  vitrasaId: string | null;
  name: string;
  lat: number | null;
  lon: number | null;
  lineIds: string[];
}

export interface StopsResponse {
  datasetVersion: string;
  generatedAt: string;
  stops: NetworkStop[];
}

export interface ArrivalsResponse {
  stopId: string;
  generatedAt: string;
  dataStatus: DataStatus;
  arrivals: Arrival[];
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'STOP_NOT_EXIST'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'STALE_UNAVAILABLE'
  | 'UPSTREAM_TIMEOUT';

export interface ErrorResponse {
  error: { code: ErrorCode; message: string };
}

