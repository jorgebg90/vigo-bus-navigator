| **Castellano** | [Galego](README.gl.md) | [English](README.en.md) |
| --- | --- | --- |

# Navegador de autobuses de Vigo

> Explora líneas, paradas, horarios publicados y llegadas de autobuses de Vigo
> en una aplicación web estática que puede funcionar sin conexión. El navegador
> consulta directamente los datos públicos municipales.

## Propósito y límites

Navegador de autobuses de Vigo es una PWA comunitaria, centrada en el navegador,
para el transporte urbano de Vigo. Permite buscar líneas y paradas, consultar
los servicios de días laborables, sábados, domingos y festivos, ver llegadas
cuando están disponibles y guardar favoritos localmente.
Incluye un buscador punto a punto con direcciones predictivas, alternativas de
bus, pasos a pie, transbordos y recorrido de la opción seleccionada en el mapa.

El proyecto es estático y solo funciona en el cliente: no tiene backend de
aplicación, proxy de transporte, cuentas de usuario ni seguimiento de la
actividad. Cuando se activa un perfil con datos en directo, el navegador hace
peticiones GET fijas y sin credenciales al servicio municipal. No es un
servicio oficial de Vitrasa.

## Arquitectura

El código de ejecución sigue límites hexagonales: el dominio y la aplicación
contienen las reglas y los casos de uso; las integraciones con el navegador,
los datos municipales, el almacenamiento y el mapa actúan como adaptadores; y
la [raíz de composición](./frontend/src/main.ts) los conecta. Los tests
comprueban el inventario del código fuente y las reglas de dependencias.

```mermaid
flowchart LR
  visitor((Persona usuaria))

  subgraph pwa["PWA estática en el navegador"]
    ui["Interfaz y eventos<br/>Adaptadores de entrada"]
    root["Raíz de composición<br/>frontend/src/main.ts"]

    subgraph core["Núcleo hexagonal"]
      usecases["Casos de uso de la aplicación"]
      domain["Reglas y tipos del dominio"]
      ports["Puertos de la aplicación"]
      usecases --> domain
      usecases --> ports
    end

    subgraph adapters["Adaptadores de salida"]
      municipal["Adaptadores municipales<br/>JSP, autocompletado y OTP"]
      storage["Adaptador de almacenamiento del navegador"]
      system["Geolocalización, reloj y visibilidad"]
      map["Adaptador de MapLibre"]
      bundled["Catálogos y horarios incluidos"]
    end

    worker["Service worker<br/>almacena en caché recursos estáticos"]
  end

  visitor --> ui
  ui --> root
  root --> ui
  root -. conecta .-> usecases
  root -. crea .-> municipal
  root -. crea .-> storage
  root -. crea .-> system
  root -. crea .-> map
  root -. crea .-> bundled
  root -. registra .-> worker

  municipal -. implementa .-> ports
  storage -. implementa .-> ports
  system -. implementa .-> ports
  map -. implementa .-> ports
  bundled -. implementa .-> ports
  municipal --> municipalService["Servicios municipales de Vigo<br/>Datos, direcciones y rutas"]
  storage --> localStorage[(localStorage)]
  system --> browserApi["APIs del navegador"]
  map --> maplibre["MapLibre GL JS"]
  worker --> staticCache[(Caché de recursos estáticos)]
```

- [Arquitectura de ejecución y comprobaciones locales](./docs/architecture.md)
- [Inventario de arquitectura y pruebas aisladas](./frontend/tests/architecture/modules.json)
- [Carta del arnés de agentes](./docs/harness-charter.md), documento de referencia
  para los agentes del proyecto y las revisiones obligatorias

## Documentación OpenAPI

Consulta el [portal OpenAPI de la aplicación](https://jorgebg90.github.io/vigo-bus-navigator/docs/openapi/).
La compilación valida y publica todos los contratos actuales:

- [Transporte municipal JSP y modelos normalizados](./specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml).
- [Autocompletado municipal y modelos de direcciones](./specs/011-bus-itinerary-search/contracts/address-geocoding.openapi.yaml).
- [Planificador OTP y modelos de itinerario](./specs/011-bus-itinerary-search/contracts/route-planning.openapi.yaml).
- [Recursos externos del mapa CARTO](./specs/011-bus-itinerary-search/contracts/map-resources.openapi.yaml).

Para verla localmente, ejecuta `npm run build` y `npm run preview`; después
abre [`/docs/openapi/`](http://127.0.0.1:4173/docs/openapi/). Es documentación
HTML estática de contratos, no una API alojada, un backend ni un proxy de
transporte.

El portal usa Swagger UI con operaciones y esquemas desplegables, selector de
contratos y YAML de solo lectura. JavaScript/CSS se sirven desde el propio
alojamiento, sin CDN ni validador externo. «Try it out» está desactivado: la
documentación no ejecuta llamadas que omitan los puertos/adaptadores.

Cada integración está detrás de un puerto de aplicación y un adaptador de
salida. Los contratos distinguen el formato externo de los modelos internos;
`x-hexagonal` identifica el caso de uso, puerto y adaptador. Véanse la
[arquitectura actual](./docs/architecture.md) y la
[especificación del buscador](./specs/011-bus-itinerary-search/spec.md).

## Primeros pasos

Requisitos: Node.js 22 y npm.

```bash
npm ci
npm run dev
```

`npm run dev` usa el perfil municipal `local-live` configurado en
`frontend/.env.development`; consulta la fuente municipal directamente desde
el navegador. Define `VITE_MUNICIPAL_PROFILE=fixture` para usar respuestas
sintéticas del servicio JSP. Este perfil no desactiva el autocompletado ni OTP:
buscar direcciones o viajes sigue llamando a esos servicios. Los E2E los
sustituyen explícitamente por fixtures.

## Validación

```bash
npm run typecheck
npm test
npm run test:coverage
npm run test:e2e
npm run lint:openapi
npm run validate:municipal-api-contract
npm run build
npm run size
```

Las pruebas y los perfiles de navegador usan datos de prueba y no consultan el
servicio municipal. Ejecuta `npm run build` antes de `npm run size`; el segundo
comando comprueba los límites de tamaño del primer mapa y de cada archivo. Para
probar una ruta base, usa `VITE_BASE_PATH=/ npm run build` o
`VITE_BASE_PATH=/vigo-bus-navigator/ npm run build`. La compilación que se
despliega en GitHub Pages usa esta última ruta.
Ejecuta la suite E2E de Playwright localmente durante el desarrollo; no forma
parte de la validación de las PR en GitHub Actions.

## Fuentes de datos y disponibilidad

La integración municipal está en
[`frontend/src/infrastructure/municipal`](./frontend/src/infrastructure/municipal)
y se coordina mediante el repositorio de horarios de la aplicación. Se
encarga de la lista permitida de acciones, del transporte GET limitado, de la
normalización de la fuente, de las comprobaciones de identidad, de la
procedencia y de la caché local. Es código del navegador, no un Worker de
Cloudflare, una función serverless ni una API alojada por separado.

| Perfil municipal | Comportamiento |
| --- | --- |
| `fixture` | Respuestas JSP sintéticas deterministas; no consulta el servicio JSP. |
| `local-live` | Peticiones GET desde el navegador a un origen fijo, sin credenciales. |
| `production` | Peticiones GET directas del navegador para las acciones municipales permitidas. |

Las pruebas y las compilaciones E2E seleccionan explícitamente `fixture` e
inyectan respuestas de autocompletado y OTP. Los perfiles de esta tabla son
exclusivos de la integración JSP; no controlan los recursos externos del mapa.
`VITE_PROFILE=production` y `VITE_MUNICIPAL_PROFILE=production` seleccionan el
perfil de compilación para alojamiento estático. La configuración no admite
ninguna URL de transporte alojada por separado.

Los perfiles en directo admiten catálogo municipal de paradas, líneas y
servicios, llegadas, horarios por línea/día y geometrías/secuencias obtenidas
mediante los identificadores de los horarios. El contexto detallado línea-parada
sigue limitado a su correspondencia aprobada. El catálogo incluido sigue siendo
una semilla fechada y no exhaustiva de respaldo, no una respuesta en directo.

El buscador usa el autocompletado municipal (ya no Photon) y el planificador
OTP a través de puertos independientes. Muestra alternativas, pasos, horarios,
transbordos, paradas seleccionables y geometría real. Distingue horario previsto
de dato en tiempo real y fallos de servicio de resultados vacíos. Sin conexión
no hay nuevo autocompletado ni cálculo de rutas. El acceso desde localhost está
verificado; falta verificar el origen real de producción antes de la publicación.

## Privacidad y seguridad

Los favoritos y la configuración se guardan en el `localStorage` del
navegador; no hay perfiles de usuario, credenciales ni cuentas. La aplicación
envía el texto escrito al autocompletado municipal y, al buscar un viaje,
las coordenadas seleccionadas de origen/destino y la fecha/hora al OTP municipal.
Si se selecciona la ubicación actual como extremo, se transmite esa coordenada.
No se guardan búsquedas, coordenadas ni historial de viajes. Las consultas JSP
usan identificadores públicos de transporte. El mapa externo recibe peticiones
de recursos asociadas al área visible. Los proveedores pueden procesar los
metadatos de conexión según sus propias políticas.

El service worker almacena en caché recursos estáticos de la interfaz y el
portal OpenAPI generado, pero no las respuestas de las APIs externas. Las
cachés de recibos JSP son independientes y conservan sus reglas de frescura;
autocompletado y OTP no persisten respuestas y usan `cache: no-store`. No hacen
falta secretos ni una URL de backend.

## Flujo de trabajo del proyecto

El repositorio utiliza Spec-Driven Development con GitHub Spec Kit y un arnés
de agentes del proyecto que revisa el diseño, la implementación, la
accesibilidad y la aceptación en etapas definidas. La carta es la fuente de
referencia para los ocho agentes y sus revisiones; úsala en lugar de una lista
abreviada de roles.

El flujo de comandos de Spec Kit es:

```text
/speckit-constitution → /speckit-specify → /speckit-clarify (opcional)
→ /speckit-plan → /speckit-tasks → /speckit-analyze (opcional)
→ /speckit-implement → /speckit-converge
```

La carta asigna G1 a todos los agentes; G2 a Stakeholder, QA Tester, UX
Designer y Frontend Developer; G3 a Software Architect, Backend Developer,
UX Designer y Frontend Developer; G4 a QA Tester, UX Designer y Frontend
Developer; y G5 a QA Tester, Stakeholder, UX Designer, Frontend Developer y
Software Architect. G6 es la revisión del Communicator de la documentación
del blog de cada fase, no una fase asignada a `/speckit-converge`.

Las especificaciones, los planes, las tareas y los resultados de las
revisiones están bajo `specs/`; los agentes y las habilidades personalizadas
están en `.github/agents/` y `.github/skills/`. Los detalles operativos y la
responsabilidad de las revisiones están en la
[Carta del arnés](./docs/harness-charter.md).

## Estructura del repositorio

```text
.specify/           Plantillas, scripts y constitución de Spec Kit
.github/agents/     Agentes personalizados del proyecto
.github/skills/     Flujos de trabajo de Spec Kit
docs/               Arquitectura, carta del arnés y serie de artículos
frontend/           Aplicación estática del navegador y pruebas
scripts/            Validación de contratos, generadores y herramientas de compilación
postman/            Colección de peticiones manuales a la fuente municipal
specs/              Especificaciones, planes, tareas y revisiones
```

## Estado

La cobertura automatizada incluye pruebas unitarias de Node, pruebas del DOM,
integración con datos de prueba, comprobaciones del navegador con Playwright y
análisis de accesibilidad. Instala los navegadores de Playwright con
`npx playwright install` si todavía no están disponibles.

## Licencia

Apache-2.0 — consulta [LICENSE](./LICENSE) y [NOTICE](./NOTICE).
