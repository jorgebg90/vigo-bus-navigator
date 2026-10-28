export type MunicipalFailureReason =
  | 'transport'
  | 'timeout'
  | 'rate-limited'
  | 'http'
  | 'invalid'
  | 'oversized'
  | 'identity-unverified'
  | 'mapping-unverified'
  | 'offline';

export class MunicipalOperationError extends Error {
  constructor(
    readonly reason: MunicipalFailureReason,
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'MunicipalOperationError';
  }
}
