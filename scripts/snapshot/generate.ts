import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { validateStopCoordinates } from './geo';

const root = resolve(import.meta.dirname, '../..');
const source = resolve(root, 'scripts/snapshot/source/manifest.json');
const target = resolve(root, 'worker/src/schedule-data/manifest.json');
const sourceStops = resolve(root, 'scripts/snapshot/source/stops.json');
const sourceLines = resolve(root, 'scripts/snapshot/source/lines');
const targetLines = resolve(root, 'worker/src/schedule-data/lines');

const manifest = JSON.parse(await readFile(source, 'utf8')) as Record<string, any>;
if (typeof manifest.datasetVersion !== 'string' || typeof manifest.validFrom !== 'string' || typeof manifest.validUntil !== 'string' || typeof manifest.generatedAt !== 'string' || !Array.isArray(manifest.holidays) || !Array.isArray(manifest.lines)) {
	throw new Error('Manifest requires datasetVersion, validity dates, generatedAt, holidays, and lines');
}
if (manifest.validFrom > manifest.validUntil) throw new Error('Manifest validFrom must not be after validUntil');

const stops = JSON.parse(await readFile(sourceStops, 'utf8')) as Array<Record<string, unknown>>;
const stopIds = new Set<string>();
for (const stop of stops) {
	if (typeof stop.id !== 'string' || typeof stop.code !== 'string' || typeof stop.name !== 'string' || typeof stop.lat !== 'number' || typeof stop.lon !== 'number' || !Array.isArray(stop.lineIds)) throw new Error('Every stop requires id, code, name, coordinates, and lineIds');
	if (stopIds.has(stop.id)) throw new Error(`Duplicate stop id: ${stop.id}`);
	validateStopCoordinates({ lat: stop.lat, lon: stop.lon }, `stop ${stop.id} (${stop.name})`);
	stopIds.add(stop.id);
}

const lineFiles = (await readdir(sourceLines)).filter((file) => file.endsWith('.json')).sort();
const lineEntries = [];
for (const line of manifest.lines as Array<Record<string, unknown>>) {
	if (typeof line.id !== 'string' || typeof line.code !== 'string' || typeof line.name !== 'string' || typeof line.color !== 'string') throw new Error('Every line requires id, code, name, and color');
	const file = `${line.id}.json`;
	if (!lineFiles.includes(file)) throw new Error(`Missing timetable source: ${file}`);
	const timetable = JSON.parse(await readFile(resolve(sourceLines, file), 'utf8')) as Record<string, any>;
	if (timetable.lineId !== line.id || !timetable.byDayType || typeof timetable.byDayType !== 'object') throw new Error(`Invalid timetable: ${file}`);
	for (const service of Object.values(timetable.byDayType) as Array<Record<string, any>>) {
		if (!Array.isArray(service.stopIds) || service.stopIds.some((id) => !stopIds.has(id))) throw new Error(`Unknown stop in timetable: ${file}`);
	}
	const body = JSON.stringify(timetable);
	await mkdir(targetLines, { recursive: true });
	await writeFile(resolve(targetLines, file), `${body}\n`);
	lineEntries.push({ ...line, file: `lines/${file}`, size: Buffer.byteLength(body), sha: createHash('sha256').update(body).digest('hex') });
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify({ ...manifest, lines: lineEntries })}\n`);
