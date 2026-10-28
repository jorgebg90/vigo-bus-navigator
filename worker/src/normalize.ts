/** Normalize extracted source rows into the public arrivals wire contract. */

import type { Arrival } from './types';
import type { VitrasaSourceRow } from './source-html';

export class StopNotExistError extends Error {
  constructor() {
    super('STOP_NOT_EXIST');
    this.name = 'StopNotExistError';
  }
}

function continuationByte(character: string): number | undefined {
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) return undefined;
  if (codePoint >= 0x80 && codePoint <= 0xbf) return codePoint;
  if (codePoint >= 0xa0 && codePoint <= 0xff) {
    const encoded = new TextEncoder().encode(character);
    return encoded[encoded.length - 1];
  }
  for (let byte = 0x80; byte <= 0x9f; byte += 1) {
    const decoded = new TextDecoder('windows-1252').decode(Uint8Array.of(byte));
    if (decoded === character) return byte;
  }
  return undefined;
}

/** Recover two-byte UTF-8 characters that the source decoded as legacy text. */
export function fixMojibake(text: string): string {
  const characters = [...text];
  const repaired: string[] = [];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for (let index = 0; index < characters.length; index += 1) {
    const prefix = characters[index].codePointAt(0);
    const next = characters[index + 1];
    if ((prefix === 0xc2 || prefix === 0xc3) && next) {
      const continuation = continuationByte(next);
      if (continuation !== undefined) {
        try {
          const value = decoder.decode(Uint8Array.of(prefix, continuation));
          repaired.push(value);
          index += 1;
          continue;
        } catch { /* Keep source text that is not a valid UTF-8 pair. */ }
      }
    }
    repaired.push(characters[index]);
  }
  return repaired.join('');
}

function normalizeSourceText(text: string, removeAsterisks = false): string {
  const normalized = fixMojibake(text).replace(/"/g, "'");
  return (removeAsterisks ? normalized.replace(/\*/g, '') : normalized).trim();
}

const MAX_MINUTES = 1440;

/** Normalize already-extracted Vitrasa rows without Worker or HTML dependencies. */
export function normalizeSourceRows(rows: readonly VitrasaSourceRow[], generatedAt: string): Arrival[] {
  const epoch = Date.parse(generatedAt);
  if (!Number.isFinite(epoch)) throw new Error('Invalid arrivals timestamp');

  const normalized: Arrival[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const lineCode = normalizeSourceText(row.lineCode);
    const destination = normalizeSourceText(row.destination, true);
    const minutesText = row.minutesText.trim();
    if (!lineCode || lineCode.length > 32) throw new Error('Invalid arrival line code');
    if (!destination || destination.length > 256) throw new Error('Invalid arrival destination');
    if (!/^\d{1,4}$/.test(minutesText)) throw new Error('Invalid arrival minutes');

    const minutes = Number(minutesText);
    if (!Number.isSafeInteger(minutes) || minutes < 0 || minutes > MAX_MINUTES) {
      throw new Error('Arrival minutes out of range');
    }

    const key = JSON.stringify([lineCode, destination, minutes]);
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      lineCode,
      destination,
      minutes,
      eta: new Date(epoch + minutes * 60_000).toISOString()
    });
  }

  normalized.sort((left, right) =>
    left.minutes - right.minutes || left.destination.localeCompare(right.destination)
  );
  return normalized;
}
