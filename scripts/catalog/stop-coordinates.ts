export type StopCoordinates = { lat: number | null; lon: number | null };
export interface CatalogStopRecord {
	id: string;
	code: string;
	municipalCode: string | null;
	vitrasaId: string | null;
	name: string;
	lat: number | null;
	lon: number | null;
	lineCodes: Set<string>;
}

const LATITUDE_BOUNDS = [42.1, 42.32] as const;
const LONGITUDE_BOUNDS = [-8.85, -8.6] as const;

function parseCoordinate(value: unknown): number | null {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value !== 'string' || value.trim() === '') return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeStopCoordinates(latValue: unknown, lonValue: unknown): StopCoordinates {
	const lat = parseCoordinate(latValue);
	const lon = parseCoordinate(lonValue);
	if (
		lat === null || lon === null ||
		lat < LATITUDE_BOUNDS[0] || lat > LATITUDE_BOUNDS[1] ||
		lon < LONGITUDE_BOUNDS[0] || lon > LONGITUDE_BOUNDS[1]
	) {
		return { lat: null, lon: null };
	}
	return { lat, lon };
}

export function addCatalogStop(
	stops: Map<string, CatalogStopRecord>,
	input: { municipalCode?: unknown; vitrasaId?: unknown; name?: unknown; lat?: unknown; lon?: unknown }
): CatalogStopRecord | undefined {
	const municipalCode = String(input.municipalCode ?? '').trim() || null;
	const vitrasaId = String(input.vitrasaId ?? '').trim() || null;
	const key = municipalCode ?? vitrasaId;
	if (!key) return undefined;

	const coordinates = normalizeStopCoordinates(input.lat, input.lon);
	const existing = stops.get(key);
	const id = `stop-${key}`;
	const stop = existing ?? {
		id,
		code: vitrasaId ?? municipalCode ?? id,
		municipalCode,
		vitrasaId,
		name: '',
		...coordinates,
		lineCodes: new Set<string>()
	};
	stop.name ||= String(input.name ?? '').trim() || id;
	if (stop.lat === null && coordinates.lat !== null) {
		stop.lat = coordinates.lat;
		stop.lon = coordinates.lon;
	}
	stops.set(key, stop);
	return stop;
}