import type { ArrivalReceipt } from './types';

export function isReceiptTimestampConsistent(
  receipt: Pick<ArrivalReceipt, 'fetchedAt' | 'provenance'>
): boolean {
  return receipt.fetchedAt === receipt.provenance.fetchedAt;
}
