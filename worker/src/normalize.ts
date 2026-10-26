/**
 * This module is based on the code of VigoBusAPI
 * (https://github.com/David-Lor/VigoBusAPI), Copyright 2021-2023 David Lorenzo,
 * licensed under the Apache License 2.0.
 *
 * Ported to TypeScript for the Vigo Bus Navigator Cloudflare Worker:
 *  - vigobus_getters/string_fixes.py      → fixMojibake (CHARS_FIXED)
 *  - vigobus_getters/helpers.py           → deterministic arrival ordering
 *  - vigobus_getters/html/html_parser.py  → exact duplicate removal
 *
 * Modifications: typed wire contract (Arrival), eta computed as generatedAt + minutes,
 * drop-rule for empty destinations / out-of-range minutes, StopNotExist surfaced via
 * the STOP_NOT_EXIST error instead of an exception hierarchy.
 */

import type { Arrival } from './types';
import type { VitrasaSourceRow } from './source-html';

const CHARS_FIXED: Record<string, string> = {
  'Ã': 'Á', 'Ã¡': 'á', 'Ã‰': 'É', 'Ã©': 'é', 'Ã': 'Í', 'Ã­': 'í',
  'Ã“': 'Ó', 'Ã³': 'ó', 'Ãš': 'Ú', 'Ãº': 'ú', 'Ã‘': 'Ñ', 'Ã±': 'ñ', 'Â¿': '¿'
};

export class StopNotExistError extends Error {
  constructor() {
    super('STOP_NOT_EXIST');
    this.name = 'StopNotExistError';
  }
}

/** Repair UTF-8-as-Latin-1 mojibake returned by the upstream source. */
export function fixMojibake(text: string): string {
  let fixed = text;
  for (const [broken, repaired] of Object.entries(CHARS_FIXED)) {
    fixed = fixed.split(broken).join(repaired);
  }
  return fixed;
}

const MAX_MINUTES = 1440;

/** Normalize already-extracted Vitrasa rows without Worker or HTML dependencies. */
export function normalizeSourceRows(rows: readonly VitrasaSourceRow[], generatedAt: string): Arrival[] {
  const epoch = Date.parse(generatedAt);
  if (!Number.isFinite(epoch)) throw new Error('Invalid arrivals timestamp');

  const normalized: Arrival[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const lineCode = fixMojibake(row.lineCode).replace(/"/g, "'").trim();
    const destination = fixMojibake(row.destination).replace(/"/g, "'").replace(/\*/g, '').trim();
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
