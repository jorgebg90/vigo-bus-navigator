import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { unzipSync } from 'fflate';

const root = resolve(import.meta.dirname, '../..');
const target = resolve(root, 'worker/src/catalog-data.json');
const sources = {
	stops: 'https://datos.vigo.org/data/transporte/paradas.json',
	gtfs: 'https://datos.vigo.org/data/transporte/gtfs_vigo.zip',
	lines: 'https://datos.vigo.org/data/transporte/lineas.geojson'
} as const;

type Row = Record<string, string>;
type CatalogStop = {
	id: string;
	code: string;
	municipalCode: string | null;
	vitrasaId: string | null;
	name: string;
	lat: number;
	lon: number;
	lineIds: string[];
};
type CatalogPattern = { id: string; headsign: string; stopIds: string[] };
type CatalogLine = { id: string; code: string; name: string; color: string | null; stopCount: number; patterns: CatalogPattern[] };

function normalizeCode(value: unknown): string {
	return String(value ?? '').trim().toUpperCase().replace(/\s+/g, '').replace(/[.-]+$/, '');
}

function parseRows(data: Uint8Array | undefined): Row[] {
	if (!data) return [];
	return parse(new TextDecoder('utf-8').decode(data), { bom: true, columns: true, skip_empty_lines: true }) as Row[];
}

async function getJson(url: string): Promise<any> {
	const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
	if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
	return response.json();
}

async function getBytes(url: string): Promise<Uint8Array> {
	const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
	if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
	return new Uint8Array(await response.arrayBuffer());
}

function effectiveLine(baseValue: unknown, headsignValue: unknown): { code: string; headsign: string } | undefined {
	const base = normalizeCode(baseValue);
	const headsign = String(headsignValue ?? '').trim();
	if (!base) return undefined;
	const quoted = headsign.match(/^\s*["“«']\s*([A-Za-z0-9]{1,4})\s*["”»']\s*[-–—:]?\s*(\S.*)$/);
	if (quoted) {
		const variant = normalizeCode(quoted[1]);
		return { code: variant.startsWith(base) || base.endsWith(variant) ? variant : `${base}${variant}`, headsign: quoted[2].trim() };
	}
	const numeric = headsign.match(/^\s*(\d+)\s+(\S.*)$/);
	if (base.length === 1 && /^[A-Z]$/.test(base) && numeric) {
		return { code: `${base}${numeric[1]}`, headsign: numeric[2].trim() };
	}
	return { code: base, headsign };
}

const [rawStops, lineGeoJson, zipBytes] = await Promise.all([
	getJson(sources.stops),
	getJson(sources.lines),
	getBytes(sources.gtfs)
]);
const gtfs = unzipSync(zipBytes);
const gtfsStops = parseRows(gtfs['stops.txt']);
const gtfsRoutes = parseRows(gtfs['routes.txt']);
const gtfsTrips = parseRows(gtfs['trips.txt']);
const gtfsStopTimes = parseRows(gtfs['stop_times.txt']);
const paradas = Array.isArray(rawStops) ? rawStops : rawStops?.data ?? rawStops?.paradas ?? [];

const colors = new Map<string, string>();
for (const feature of lineGeoJson?.features ?? []) {
	const properties = feature?.properties;
	const code = normalizeCode(properties?.linea);
	const color = typeof properties?.color === 'string' ? properties.color.trim() : '';
	if (code && /^#[0-9a-f]{6}$/i.test(color)) colors.set(code, color);
}

const stopsByMunicipalCode = new Map<string, {
	id: string;
	code: string;
	municipalCode: string | null;
	vitrasaId: string | null;
	name: string;
	lat: number;
	lon: number;
	lineCodes: Set<string>;
}>();
const stopsByVitrasaId = new Map<string, typeof stopsByMunicipalCode extends Map<string, infer T> ? T : never>();
const lines = new Map<string, {
	id: string;
	code: string;
	name: string;
	stopIds: Set<string>;
	patterns: Map<string, CatalogPattern>;
}>();

function ensureLine(codeValue: unknown, nameValue?: unknown) {
	const code = normalizeCode(codeValue);
	if (!code) return undefined;
	let line = lines.get(code);
	if (!line) {
		line = { id: `line-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, code, name: code, stopIds: new Set(), patterns: new Map() };
		lines.set(code, line);
	}
	const name = String(nameValue ?? '').trim();
	if (name && name !== code && line.name === code) line.name = name;
	return line;
}

function addStop(input: {
	municipalCode?: unknown;
	vitrasaId?: unknown;
	name?: unknown;
	lat?: unknown;
	lon?: unknown;
	lineCodes?: string[];
}) {
	const municipalCode = String(input.municipalCode ?? '').trim() || null;
	const vitrasaId = String(input.vitrasaId ?? '').trim() || null;
	const key = municipalCode ? `m:${municipalCode}` : vitrasaId ? `v:${vitrasaId}` : '';
	if (!key) return undefined;
	const lat = Number(input.lat);
	const lon = Number(input.lon);
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
	const stops = municipalCode ? stopsByMunicipalCode : stopsByVitrasaId;
	const existing = stops.get(municipalCode ?? vitrasaId!);
	const id = `stop-${municipalCode ?? vitrasaId}`;
	const stop = existing ?? {
		id,
		code: vitrasaId ?? municipalCode!,
		municipalCode,
		vitrasaId,
		name: '',
		lat,
		lon,
		lineCodes: new Set<string>()
	};
	stop.name ||= String(input.name ?? '').trim();
	if (!stop.name) stop.name = id;
	if (!existing || stop.lat === 0 || stop.lon === 0) {
		stop.lat = lat;
		stop.lon = lon;
	}
	for (const code of input.lineCodes ?? []) {
		const normalized = normalizeCode(code);
		if (normalized) {
			stop.lineCodes.add(normalized);
			ensureLine(normalized)?.stopIds.add(stop.id);
		}
	}
	stops.set(municipalCode ?? vitrasaId!, stop);
	return stop;
}

for (const stop of paradas) {
	const lineCodes = String(stop?.lineas ?? '').split(',').map((code: string) => normalizeCode(code)).filter(Boolean);
	addStop({
		municipalCode: stop?.stop_id,
		vitrasaId: stop?.id,
		name: stop?.nombre,
		lat: stop?.lat,
		lon: stop?.lon,
		lineCodes
	});
}

for (const stop of gtfsStops) {
	const existing = stopsByMunicipalCode.get(stop.stop_id);
	addStop({
		municipalCode: stop.stop_id,
		name: existing?.name || stop.stop_name,
		lat: existing?.lat ?? stop.stop_lat,
		lon: existing?.lon ?? stop.stop_lon
	});
}

const routeById = new Map<string, { code: string; name: string }>();
for (const route of gtfsRoutes) {
	const baseCode = normalizeCode(route.route_short_name);
	if (!baseCode) continue;
	const name = String(route.route_long_name ?? '').trim() || baseCode;
	ensureLine(baseCode, name);
	routeById.set(route.route_id, { code: baseCode, name });
}

const tripById = new Map(gtfsTrips.map((trip) => [trip.trip_id, trip]));
const timesByTrip = new Map<string, Array<{ sequence: number; stopCode: string }>>();
for (const row of gtfsStopTimes) {
	const stopCode = String(row.stop_id ?? '').trim();
	const sequence = Number(row.stop_sequence);
	if (!stopCode || !Number.isFinite(sequence)) continue;
	const tripTimes = timesByTrip.get(row.trip_id) ?? [];
	tripTimes.push({ sequence, stopCode });
	timesByTrip.set(row.trip_id, tripTimes);
}

for (const [tripId, times] of timesByTrip) {
	const trip = tripById.get(tripId);
	const route = trip && routeById.get(trip.route_id);
	if (!trip || !route) continue;
	times.sort((a, b) => a.sequence - b.sequence);
	const stops = times.map(({ stopCode }) => stopsByMunicipalCode.get(stopCode)).filter((stop): stop is NonNullable<typeof stop> => Boolean(stop));
	if (stops.length < 2) continue;
	const effective = effectiveLine(route.code, trip.trip_headsign);
	if (!effective) continue;
	const line = ensureLine(effective.code, route.name);
	if (!line) continue;
	const stopIds = stops.map((stop) => stop.id);
	for (const stop of stops) {
		stop.lineCodes.add(line.code);
		line.stopIds.add(stop.id);
	}
	const key = `${effective.headsign}\u0000${stopIds.join('\u0000')}`;
	line.patterns.set(key, {
		id: `pattern-${createHash('sha256').update(`${line.code}\u0000${key}`).digest('hex').slice(0, 12)}`,
		headsign: effective.headsign,
		stopIds
	});
}

const stops: CatalogStop[] = [...stopsByMunicipalCode.values(), ...stopsByVitrasaId.values()]
	.map((stop) => ({
		id: stop.id,
		code: stop.code,
		municipalCode: stop.municipalCode,
		vitrasaId: stop.vitrasaId,
		name: stop.name,
		lat: stop.lat,
		lon: stop.lon,
		lineIds: [...stop.lineCodes].map((code) => lines.get(code)?.id).filter((id): id is string => Boolean(id)).sort()
	}))
	.sort((a, b) => a.name.localeCompare(b.name, 'gl'));
const stopIds = new Set(stops.map((stop) => stop.id));
const catalogLines: CatalogLine[] = [...lines.values()]
	.map((line) => ({
		id: line.id,
		code: line.code,
		name: line.name,
		color: colors.get(line.code) ?? colors.get(line.code.replace(/[A-Z]+$/, '')) ?? null,
		stopCount: line.stopIds.size,
		patterns: [...line.patterns.values()]
	}))
	.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));

for (const line of catalogLines) {
	line.patterns = [...lines.get(line.code)!.patterns.values()]
		.filter((pattern) => pattern.stopIds.every((id) => stopIds.has(id)))
		.sort((a, b) => a.headsign.localeCompare(b.headsign, 'gl'));
}
if (stops.length === 0 || catalogLines.length === 0) throw new Error('Official sources produced an empty catalog');

const catalog = {
	datasetVersion: `vigo-open-data-${new Date().toISOString().slice(0, 10)}`,
	generatedAt: new Date().toISOString(),
	sources,
	lines: catalogLines,
	stops
};
await mkdir(resolve(root, 'worker/src'), { recursive: true });
await writeFile(target, `${JSON.stringify(catalog)}\n`);
console.log(`Generated ${catalogLines.length} lines, ${stops.length} stops, ${catalogLines.reduce((count, line) => count + line.patterns.length, 0)} route patterns`);