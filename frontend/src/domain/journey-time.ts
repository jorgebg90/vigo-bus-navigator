const MADRID_TIME_ZONE = 'Europe/Madrid';

interface LocalDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function parseMadridLocalDateTime(value: string): number | null {
  const local = parseLocalDateTime(value);
  if (!local) return null;
  const targetUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  const offsets = new Set<number>();
  for (const hours of [-36, -12, 12, 36]) {
    const sample = targetUtc + hours * 60 * 60 * 1000;
    const parts = madridParts(sample);
    const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    offsets.add(representedAsUtc - sample);
  }
  const matches = [...offsets]
    .map((offset) => targetUtc - offset)
    .filter((timestamp) => matchesLocalTime(timestamp, local));
  return matches.length === 1 ? matches[0] : null;
}

export function currentMadridLocalDateTime(now = Date.now()): string {
  const parts = madridParts(now);
  return `${pad(parts.year, 4)}-${pad(parts.month, 2)}-${pad(parts.day, 2)}T${pad(parts.hour, 2)}:${pad(parts.minute, 2)}`;
}

function parseLocalDateTime(value: string): LocalDateTime | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const local = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: Number(hourText),
    minute: Number(minuteText)
  };
  const validated = new Date(Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute));
  if (validated.getUTCFullYear() !== local.year
    || validated.getUTCMonth() + 1 !== local.month
    || validated.getUTCDate() !== local.day
    || local.hour > 23
    || local.minute > 59) return null;
  return local;
}

function madridParts(timestamp: number): LocalDateTime {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(timestamp));
  const value = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((candidate) => candidate.type === type)?.value;
    if (!part) throw new Error(`Missing ${type} in Madrid time formatter.`);
    return Number(part);
  };
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute')
  };
}

function matchesLocalTime(timestamp: number, target: LocalDateTime): boolean {
  const parts = madridParts(timestamp);
  return parts.year === target.year
    && parts.month === target.month
    && parts.day === target.day
    && parts.hour === target.hour
    && parts.minute === target.minute;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}
