import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { MUNICIPAL_ACTIONS, type MunicipalAction } from '../frontend/src/infrastructure/municipal/request-builder';
import { isMunicipalActionEnabled } from '../frontend/src/infrastructure/municipal/action-readiness';

const fixedMunicipalEndpoint = 'https://datos.vigo.org/vci_api_app/api2.jsp';
const supportedProductionActions = [
  'TRANSPORTE_LINEAS_ES',
  'TRANSPORTE_LINEAS_GA',
  'TRANSPORTE_LINEAS_SERVICIOS_ES',
  'TRANSPORTE_LINEAS_SERVICIOS_GA',
  'TRANSPORTE_PARADA_ID',
  'TRANSPORTE_LINEAS_PARADA',
  'TRANSPORTE_PARADAS',
  'TRANSPORTE-ESTIMACION-PARADA'
] as const;
const onlineCatalogParameters: ReadonlyArray<readonly [MunicipalAction, Readonly<Record<string, string>>]> = [
  ['TRANSPORTE_LINEA_HORARIOS_EXTEND', { id: 'A', dia: '1' }],
  ['TRANSPORTE_LINEA_HORARIOS_EXTEND', { id: '4C', dia: '6' }],
  ['TRANSPORTE_LINEA_HORARIOS_EXTEND', { id: 'C1', dia: '0' }],
  ['TRANSPORTE_LINEA_GEOJSON', { id: 'Route_664' }],
  ['TRANSPORTE_PARADAS_TRIP', { id: 'L4 02LP101_004002_6' }],
  ['TRANSPORTE_LINEA_INFO_PARADA', { stop_id: '2789', linea: 'A' }]
];
const assetExtensions = new Set(['.html', '.js', '.css', '.json', '.webmanifest']);

export function validateProductionArtifact(assetRoot = resolve('dist')): void {
  const files = listAssetFiles(assetRoot);
  if (files.length === 0) throw new Error(`No production assets found in ${assetRoot}`);

  const content = files.map((file) => readFileSync(file, 'utf8')).join('\n');
  if (!content.includes(fixedMunicipalEndpoint)) {
    throw new Error('Production assets do not contain the fixed municipal JSP endpoint');
  }
  if (/https?:\/\/[^"'`\s]*(?:workers\.dev|cloudflareworkers\.com)/i.test(content)
    || /\/api\/v[0-9]+(?:\/|["'`?])/i.test(content)) {
    throw new Error('Production assets contain a legacy transit API or Worker URL');
  }
  if (/\b(?:fetch|fetcher)\s*\([^)]{0,500}\bcredentials\s*:\s*["'](?:include|same-origin)["']/i.test(content)
    || /\bwithCredentials\s*=\s*true\b/i.test(content)) {
    throw new Error('Production assets contain a credentialed request configuration');
  }

  const enabled = MUNICIPAL_ACTIONS.filter((action) => isMunicipalActionEnabled(action, 'production'));
  if (!sameItems(enabled, supportedProductionActions)) {
    throw new Error(`Unexpected production action set: ${enabled.join(', ')}`);
  }
  for (const [action, parameters] of onlineCatalogParameters) {
    if (!isMunicipalActionEnabled(action, 'production', parameters)) {
      throw new Error(`Approved production online catalog request is disabled: ${action}`);
    }
  }
  if (isMunicipalActionEnabled('TRANSPORTE_LINEA_INFO_PARADA', 'production', { stop_id: '2790', linea: 'A' })) {
    throw new Error('Unapproved production line-stop detail mapping is enabled');
  }
}

function listAssetFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...listAssetFiles(path));
    else if (assetExtensions.has(path.slice(path.lastIndexOf('.')))) files.push(path);
  }
  return files;
}

function sameItems(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && expected.every((item) => actual.includes(item));
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  try {
    validateProductionArtifact();
    console.log('Production artifact guard passed: fixed JSP endpoint, credential-free requests, eight general actions, online line schedule/shape/trip-stop catalog, and the exact line-stop detail mapping verified.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
