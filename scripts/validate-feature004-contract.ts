import { readFile } from 'node:fs/promises';
import { parseDocument } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';

const contractPath = new URL('../specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml', import.meta.url);
const source = await readFile(contractPath, 'utf8');
const document = parseDocument(source);
if (document.errors.length > 0) {
  throw new Error(`Feature 004 OpenAPI YAML is invalid: ${document.errors.map((error) => error.message).join('; ')}`);
}

const contract = document.toJSON() as {
  openapi?: string;
  info?: { version?: string };
  components?: { schemas?: Record<string, unknown> };
  paths?: Record<string, unknown>;
  'x-source-actions'?: Record<string, {
    provisionalEvaluation?: {
      fixtureOnly?: boolean;
      assumptions?: string[];
      tripIdLeadingToken?: string;
    };
  }>;
  'x-profile-readiness'?: {
    provisionalEvaluation?: {
      profile?: string;
      actions?: string[];
      networkRequests?: boolean;
    };
    localLiveAllowed?: string[];
    onlineCatalog?: {
      profiles?: string[];
      authorization?: string;
      actions?: string[];
      parameters?: string;
    };
    localLiveScoped?: {
      evidenceClass?: string;
      productionReady?: boolean;
      actions?: Array<{
        action?: string;
        allowedParameters?: Array<Record<string, string>>;
        constants?: Record<string, string>;
        linkedScheduleDay?: string;
      }>;
      allOtherParameters?: string;
    };
    productionScoped?: {
      authorization?: string;
      actions?: Array<{
        action?: string;
        allowedParameters?: Array<Record<string, string>>;
        constants?: Record<string, string>;
        linkedScheduleDay?: string;
      }>;
      allOtherParameters?: string;
    };
    productionAllowed?: string[];
    productionRequiredActions?: string;
    partialProductionReleaseAllowed?: boolean;
  };
};
if (contract.openapi !== '3.1.0' || contract.info?.version !== '5.0.0') {
  throw new Error('Feature 004 contract must remain OpenAPI 3.1.0, normalized contract version 5.0.0');
}
if (Object.keys(contract.paths ?? {}).length !== 1 || !contract.paths?.['/vci_api_app/api2.jsp']) {
  throw new Error('Feature 004 contract must describe only the fixed municipal JSP endpoint');
}

const actionNames = Object.keys(contract['x-source-actions'] ?? {}).sort();
const readiness = contract['x-profile-readiness'];
const supportedActions = [
  'TRANSPORTE_LINEAS_ES',
  'TRANSPORTE_LINEAS_GA',
  'TRANSPORTE_LINEAS_SERVICIOS_ES',
  'TRANSPORTE_LINEAS_SERVICIOS_GA',
  'TRANSPORTE_PARADA_ID',
  'TRANSPORTE_LINEAS_PARADA',
  'TRANSPORTE_PARADAS',
  'TRANSPORTE-ESTIMACION-PARADA'
].sort();
const candidateActions = [
  'TRANSPORTE_LINEA_GEOJSON',
  'TRANSPORTE_LINEA_HORARIOS_EXTEND',
  'TRANSPORTE_LINEA_INFO_PARADA',
  'TRANSPORTE_PARADAS_TRIP'
].sort();
const onlineCatalogActions = [
  'TRANSPORTE_LINEA_GEOJSON',
  'TRANSPORTE_LINEA_HORARIOS_EXTEND',
  'TRANSPORTE_PARADAS_TRIP'
];
const localLiveScopedActions = [{
  action: 'TRANSPORTE_LINEA_INFO_PARADA',
  allowedParameters: [{ stop_id: '2789', linea: 'A' }],
  constants: { min: '0' }
}];
const onlineCatalog = readiness?.onlineCatalog;
const provisionalEvaluation = readiness?.provisionalEvaluation;
const lineStopEvaluation = contract['x-source-actions']?.['TRANSPORTE_LINEA_INFO_PARADA']?.provisionalEvaluation;
const scopedReadiness = readiness?.localLiveScoped;
const normalizeScopedActions = (
  actions: NonNullable<typeof scopedReadiness>['actions']
) => actions?.map(({
  action,
  allowedParameters,
  constants,
  linkedScheduleDay
}) => ({
  action,
  allowedParameters,
  ...(constants ? { constants } : {}),
  ...(linkedScheduleDay ? { linkedScheduleDay } : {})
})).sort((left, right) => left.action?.localeCompare(right.action ?? '') ?? 0);
const scopedActions = normalizeScopedActions(scopedReadiness?.actions);
const productionScoped = readiness?.productionScoped;
const productionScopedActions = normalizeScopedActions(productionScoped?.actions);
if (
  readiness?.localLiveAllowed?.length !== supportedActions.length
  || JSON.stringify(readiness?.localLiveAllowed?.slice().sort()) !== JSON.stringify(supportedActions)
  || JSON.stringify(localLiveActionsFromContract(readiness).sort()) !== JSON.stringify(actionNames)
  || JSON.stringify(scopedActions) !== JSON.stringify(localLiveScopedActions)
  || scopedReadiness?.evidenceClass !== 'stakeholder-reported-postman-validation'
  || scopedReadiness?.productionReady !== false
  || scopedReadiness?.allOtherParameters !== 'denied-before-network'
  || JSON.stringify(productionScopedActions) !== JSON.stringify(localLiveScopedActions)
  || productionScoped?.authorization !== 'product-owner-explicit-2026-10-28'
  || productionScoped.allOtherParameters !== 'denied-before-network'
  || JSON.stringify(readiness?.productionAllowed?.slice().sort()) !== JSON.stringify(supportedActions)
  || readiness?.productionRequiredActions !== 'eight-supported-actions-plus-online-line-catalog'
  || JSON.stringify(onlineCatalog?.actions?.slice().sort()) !== JSON.stringify(onlineCatalogActions)
  || JSON.stringify(onlineCatalog?.profiles?.slice().sort()) !== JSON.stringify(['local-live', 'production'])
  || onlineCatalog?.authorization !== 'product-owner-explicit-2026-10-28'
  || onlineCatalog.parameters !== 'any-request-builder-validated-identifier'
  || readiness.partialProductionReleaseAllowed !== true
  || provisionalEvaluation?.profile !== 'fixture'
  || provisionalEvaluation.networkRequests !== false
  || JSON.stringify(provisionalEvaluation.actions?.slice().sort()) !== JSON.stringify(candidateActions)
  || lineStopEvaluation?.fixtureOnly !== true
  || !lineStopEvaluation.assumptions?.includes('FR-026')
  || lineStopEvaluation.tripIdLeadingToken !== 'equals-requested-public-line-code'
) {
  throw new Error('Feature 004 readiness must allow eight general actions, the online line catalog and one exact line-stop detail mapping in both live profiles');
}

const schemaId = 'https://vigo-bus-navigator.invalid/municipal-transit-v5.openapi.yaml';
const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
ajv.addSchema({ ...contract, $id: schemaId });
const schemas = Object.keys(contract.components?.schemas ?? {});
for (const name of schemas) {
  ajv.compile({ $ref: `${schemaId}#/components/schemas/${name}` });
}

console.log(`Validated OpenAPI 3.1.0 contract v5.0.0; compiled ${schemas.length} schemas; verified eight general live actions, the online line catalog and the exact line-stop detail mapping in local-live and production.`);

function localLiveActionsFromContract(
  value: NonNullable<typeof readiness>
): string[] {
  return [
    ...(value.localLiveAllowed ?? []),
    ...(value.onlineCatalog?.actions ?? []),
    ...(value.localLiveScoped?.actions ?? []).flatMap(({ action }) => action ? [action] : [])
  ];
}
