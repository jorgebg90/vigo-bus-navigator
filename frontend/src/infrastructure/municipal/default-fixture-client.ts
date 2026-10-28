import lineCatalogEsFixture from '../../../tests/fixtures/municipal/line-catalog-es.json?raw';
import lineCatalogGaFixture from '../../../tests/fixtures/municipal/line-catalog-ga.json?raw';
import servicesEsFixture from '../../../tests/fixtures/municipal/services-es.json?raw';
import servicesGaFixture from '../../../tests/fixtures/municipal/services-ga.json?raw';
import stopDetailFixture from '../../../tests/fixtures/municipal/stop-detail.json?raw';
import servingLinesFixture from '../../../tests/fixtures/municipal/serving-lines.json?raw';
import stopCatalogFixture from '../../../tests/fixtures/municipal/stop-catalog.json?raw';
import arrivalsFixture from '../../../tests/fixtures/municipal/arrivals.json?raw';
import scheduleFixture from '../../../tests/fixtures/municipal/schedule.json?raw';
import routeGeometryFixture from '../../../tests/fixtures/municipal/route-geometry.json?raw';
import tripStopsFixture from '../../../tests/fixtures/municipal/trip-stops.json?raw';
import lineStopDetailFixture from '../../../tests/fixtures/municipal/line-stop-detail.json?raw';
import { MunicipalFixtureTransport } from './fixture-transport';
import { MunicipalHttpClient } from './http-client';

export function createDefaultFixtureMunicipalClient(
  routeFixture: 'missing' | 'invalid' | undefined = undefined
): MunicipalHttpClient {
  const routeGeometry = routeFixture === 'missing'
    ? '[]'
    : routeFixture === 'invalid'
      ? JSON.stringify([{
          st_asgeojson: JSON.stringify({
            type: 'LineString',
            coordinates: [[300, 42], [301, 43]]
          })
        }])
      : routeGeometryFixture;
  const fixtures = new MunicipalFixtureTransport({
    TRANSPORTE_LINEAS_ES: new TextEncoder().encode(lineCatalogEsFixture),
    TRANSPORTE_LINEAS_GA: new TextEncoder().encode(lineCatalogGaFixture),
    TRANSPORTE_LINEAS_SERVICIOS_ES: new TextEncoder().encode(servicesEsFixture),
    TRANSPORTE_LINEAS_SERVICIOS_GA: new TextEncoder().encode(servicesGaFixture),
    TRANSPORTE_PARADA_ID: new TextEncoder().encode(stopDetailFixture),
    TRANSPORTE_LINEAS_PARADA: new TextEncoder().encode(servingLinesFixture),
    TRANSPORTE_PARADAS: new TextEncoder().encode(stopCatalogFixture),
    'TRANSPORTE-ESTIMACION-PARADA': new TextEncoder().encode(arrivalsFixture),
    TRANSPORTE_LINEA_HORARIOS_EXTEND: new TextEncoder().encode(scheduleFixture),
    TRANSPORTE_LINEA_GEOJSON: new TextEncoder().encode(routeGeometry),
    TRANSPORTE_PARADAS_TRIP: new TextEncoder().encode(tripStopsFixture),
    TRANSPORTE_LINEA_INFO_PARADA: new TextEncoder().encode(lineStopDetailFixture)
  });
  return new MunicipalHttpClient('fixture', fixtures.fetcher);
}
