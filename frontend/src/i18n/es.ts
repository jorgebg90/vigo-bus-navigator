export const messages = {
  appTitle: 'Vigo Bus Navigator',
  searchLines: 'Buscar líneas',
  busLines: 'Líneas de autobús',
  language: 'Idioma',
  favorites: 'Favoritos',
  recentViews: 'Vistas recientes',
  storageUnavailable: 'Almacenamiento no disponible: los cambios se perderán al recargar.',
  dayType: 'Tipo de día',
  weekday: 'Día laborable',
  saturday: 'Sábado',
  sundayHoliday: 'Domingo / festivo',
  dataset: 'Datos {version}',
  noService: 'No hay servicio para este tipo de día.',
  frequencyUnavailable: 'No hay datos de frecuencia publicados para esta línea.',
  viewService: 'Ver servicio de {dayType}',
  addFavorite: 'Añadir o quitar favorito',
  timeBand: 'Franja horaria',
  first: 'Primera',
  last: 'Última',
  interval: 'Intervalo',
  stop: 'Parada {id}',
  stops: 'Paradas',
  mapLabel: 'Mapa interactivo de paradas',
  mapStops: 'Paradas del mapa',
  stopDetails: '{name} ({code}) - líneas: {lines} - {lat}, {lon}',
  mapUnavailable: 'Mapa no disponible. Se muestra la lista accesible de paradas.',
  mapDataAnomaly: '{count} parada(s) sin ubicación válida en Vigo: no se muestran en el mapa.',
  offline: 'Sin conexión: se muestran datos guardados.',
  live: 'Tiempo real',
  cached: 'Datos guardados',
  unavailable: 'Llegadas no disponibles',
  statusCurrent: 'Tiempo real',
  syntheticData: 'Datos de muestra sintéticos',
  statusStale: 'Datos desactualizados',
  statusEmpty: 'Sin llegadas próximas',
  statusUnavailable: 'Llegadas no disponibles',
  statusLoading: 'Cargando llegadas…',
  retry: 'Reintentar',
  updated: 'Actualizado: {time}',
  refreshArrivals: 'Actualizar llegadas',
  arrivalsTo: '{line} hacia {destination}: {minutes} min',
  minutes: '{minutes} min',
  navMap: 'Mapa',
  navSearch: 'Buscar',
  navJourneys: 'Planificar viaje',
  navLines: 'Líneas',
  navSaved: 'Guardado',
  about: 'Acerca de',
  noMapPosition: 'Sin ubicación en el mapa',
  close: 'Cerrar',
  expand: 'Ampliar',
  collapse: 'Contraer',
  stopSearch: 'Buscar paradas',
  clearSearch: 'Borrar búsqueda',
  noStopsFound: 'No hay paradas que coincidan con «{query}»',
  savedFavorites: 'Favoritos',
  savedRecent: 'Recientes',
  removeFavorite: 'Quitar de favoritos',
  stopPanelTitle: 'Parada {name}',
  linePanelTitle: 'Línea {line}',
  zoomIn: 'Acercar',
  zoomOut: 'Alejar',
  recenter: 'Centrar mapa',
  loadingStops: 'Cargando paradas',
  catalogError: 'No se pudieron cargar las paradas'
  ,statusOffline: 'Sin conexión'
  ,liveUnavailable: 'Las llegadas no están disponibles para esta parada'
  ,servingLines: 'Líneas que paran aquí'
  ,lineFrequencies: 'Ver frecuencias de las líneas'
  ,openLineRoute: 'Ver recorrido de la línea {line}'
  ,mapRetry: 'Reintentar mapa'
  ,useSearch: 'Usar búsqueda',
  mapControls: 'Controles del mapa',
  stopsHere: 'Paradas aquí ({count})',
  loadingLineRoute: 'Cargando el recorrido de la línea…'
  ,locationNoNearbyStops: 'No se muestran paradas de autobús cercanas.'
  ,locationUnavailable: 'No se pudo utilizar tu ubicación.'
  ,locationOutsideCoverage: 'Tu ubicación está fuera de la cobertura de Vigo.'
  ,saveFavorite: 'Guardar {name} en favoritos'
  ,removeFavoriteNamed: 'Quitar {name} de favoritos'
  ,savedEmpty: 'Aún no hay favoritos'
  ,recentEmpty: 'No hay elementos recientes'
  ,openFavorite: 'Abrir {name}'
  ,remove: 'Quitar'
  ,unavailableFavorite: 'No disponible: {name}'
  ,favoritesCannotSave: 'No se pueden guardar favoritos en este dispositivo'
  ,firstDeparture: 'Primera salida'
  ,lastDeparture: 'Última salida'
  ,frequencyCaption: 'Frecuencias de {line} · {dayType}'
  ,noPublishedService: 'No hay servicio publicado para este tipo de día'
  ,lineCatalogUnavailable: 'El catálogo municipal de líneas no está disponible ahora.'
  ,scheduleMappingUnavailable: 'El horario no está disponible porque la asociación de línea y horario aún no está verificada.'
  ,lineDepartures: 'Salidas'
  ,lineScheduleTitle: 'Salidas y llegadas'
  ,scheduleSource: 'Horario · {source} · recibido {time}'
  ,provisionalScheduleSource: 'Evaluación provisional de muestra · {source} · recibida {time}'
  ,sourceLabel: 'Fuente: {source}'
  ,provisionalSourceLabel: 'Origen provisional de muestra: {source}'
  ,routeShapeTextAlternative: 'Este trazado es una vista provisional; no hay una descripción verificada parada por parada disponible.'
  ,provisionalDataWarning: 'Datos provisionales: inferidos y no verificados por el proveedor.'
  ,routeShapePreview: 'Vista provisional del trazado'
  ,routeShape: 'Trazado del recorrido'
  ,routeShapeStopsAlternative: 'Las listas de paradas de cada sentido describen este trazado.'
  ,lineMapDefaultDirection: 'Recorrido'
  ,lineMapUnavailable: 'No hay un recorrido verificado disponible para esta línea.'
  ,loadingLineMapRoute: 'Cargando recorrido…'
  ,tripStopSequence: 'Paradas provisionales del trayecto, en orden'
  ,lineStopDepartures: 'Salidas provisionales de la línea {line}'
  ,bundledDiscoveryNotice: 'La búsqueda general de paradas y los resúmenes de recorridos aún usan el catálogo empaquetado, capturado el {date}; puede no ser exhaustivo.'
  ,servingLinesTitle: 'Líneas'
  ,servingLinesLoading: 'Cargando líneas de esta parada…'
  ,servingLinesUnavailable: 'No se pudieron verificar las líneas de esta parada.'
  ,bundledScheduleSnapshotSource: 'Horario sin conexión empaquetado · {source} · fecha de {dateKind} {date} · {line} / {direction} · {dayType}'
  ,snapshotScheduleUnavailable: 'No hay un horario empaquetado fiable para esta línea, dirección y tipo de día.'
  ,publicationDate: 'publicación'
  ,effectiveDate: 'vigencia'
  ,captureDate: 'captura'
  ,journeySearchTitle: 'Planifica tu viaje'
  ,journeyModeBus: 'Autobús'
  ,journeyRouteSearch: 'Buscar autobús'
  ,journeyOrigin: 'Origen'
  ,journeyDestination: 'Destino'
  ,journeySwapEndpoints: 'Intercambiar origen y destino'
  ,journeyClearOrigin: 'Borrar origen'
  ,journeyClearDestination: 'Borrar destino'
  ,journeyOriginPlaceholder: 'Buscar una calle o lugar en Vigo'
  ,journeyDestinationPlaceholder: 'Buscar destino en Vigo'
  ,journeyAddressSearching: 'Buscando direcciones…'
  ,journeyAddressNoResults: 'No se encontraron direcciones en Vigo.'
  ,journeyAddressUnavailable: 'No se pudo buscar la dirección. Comprueba tu conexión e inténtalo de nuevo.'
  ,journeyCurrentLocationLabel: 'Mi ubicación actual'
  ,journeyGeocoderAttribution: 'Geocodificación: planificador de Vigo'
  ,journeyPrivacySummary: 'Privacidad'
  ,journeyNearbyStops: 'Paradas cercanas'
  ,journeyNoNearbyStops: 'No hay paradas de autobús a 500 m o menos.'
  ,journeyNoStopsInCatalog: 'El catálogo de paradas disponible no contiene paradas a 500 m o menos.'
  ,journeyInvalidSearch: 'Elige dos puntos válidos distintos y una hora de salida válida en Vigo.'
  ,journeyPointOutside: 'La ubicación queda fuera de la cobertura de autobús de Vigo.'
  ,journeyPrivacyNote: 'El texto de las direcciones se envía al autocompletado municipal de Vigo para buscar sugerencias. Al buscar un viaje, las coordenadas de origen y destino y la fecha y hora se envían al planificador municipal de Vigo. La app no guarda estas búsquedas ni las registra como historial.'
  ,journeyDataIncomplete: 'Los horarios disponibles no permiten calcular un viaje completo de forma fiable.'
  ,journeyDataUnavailable: 'No se pudieron consultar los datos necesarios. Conservamos los puntos seleccionados para reintentar.'
  ,journeyNoResults: 'El planificador no devolvió opciones que cumplan esta búsqueda. Prueba otra hora o destino.'
  ,journeyResults: 'Opciones de viaje'
  ,journeyDirectResult: 'Viaje directo en la línea {line}'
  ,journeyEstimatedDuration: 'Duración estimada: {minutes} min'
  ,journeyApproxDistance: 'aprox. {meters} m'
  ,journeyApproxWalk: 'a pie aprox. {minutes} min'
  ,journeyUseCurrentLocation: 'Usar mi ubicación'
  ,journeyLocationUnavailable: 'No se pudo obtener tu ubicación. Puedes escribir una dirección para el origen.'
  ,journeyDepartureTime: 'Fecha y hora de salida (hora de Vigo) '
  ,journeySort: 'Ordenar por '
  ,journeySortArrival: 'Llegada más temprana'
  ,journeySortTransfers: 'Menos transbordos'
  ,journeySortWalking: 'Menos caminata'
  ,journeyOptionTitle: 'Salida {departure} · llegada {arrival}'
  ,journeyLegs: 'Tramos en autobús'
  ,journeyLegDescription: 'Línea {line}: {origin} a {destination}, {departure}–{arrival}'
  ,journeyOptionSummary: '{duration} min · {transfers} transbordos · caminata aprox. {walking} min · espera {wait} min · acceso aprox. {access} m · salida aprox. {egress} m'
  ,journeyLiveWait: 'Espera inicial ajustada con una llegada reciente; cuenta atrás y duración aproximadas.'
  ,journeyLiveWaitDetails: 'Espera inicial según llegada recibida hace {age} s; incertidumbre de la cuenta atrás: ±{uncertainty} min.'
  ,journeyScheduleWait: 'Espera estimada según horario verificado.'
  ,journeyLoading: 'Calculando rutas…'
  ,journeyBusLine: 'Bus {line}'
  ,journeyWalkShort: 'A pie'
  ,journeyWalkTo: 'Camina hasta {destination}'
  ,journeyTransitSummary: '{minutes} min · {transfers} transbordos · {walking} min a pie'
  ,journeyIntermediateStops: '{count} paradas intermedias'
  ,journeyWalkingDirections: 'Indicaciones a pie'
  ,journeyWalkSidewalk: 'Camina por la acera'
  ,journeyWalkPath: 'Sigue el camino peatonal'
  ,journeyWalkStairs: 'Continúa por las escaleras'
  ,journeyWalkContinue: 'Continúa a pie'
  ,journeyWalkStreet: 'Camina por {street}'
  ,journeyStepDistance: 'Durante {meters} m'
  ,journeyOtpScheduled: 'Horario previsto · Planificador municipal de Vigo'
  ,journeyOtpRealtime: 'Estimación en tiempo real · Planificador municipal de Vigo'
  ,journeyMoreOptions: 'Ver más opciones'
  ,journeyWait: 'Espera: {minutes} min'
  ,searchAllPlaceholder: 'Buscar paradas, líneas o direcciones'
  ,searchFilters: 'Tipo de resultado'
  ,searchCategoryAll: 'Todo'
  ,searchCategoryStops: 'Paradas'
  ,searchCategoryLines: 'Líneas'
  ,searchCategoryAddresses: 'Direcciones'
  ,searchResultStop: 'Parada'
  ,searchResultLine: 'Línea'
  ,searchResultAddress: 'Dirección'
  ,searchPrompt: 'Escribe una parada, línea o dirección. Las sugerencias de direcciones necesitan al menos 3 caracteres.'
  ,searchNoResults: 'Nada coincide con «{query}».'
  ,searchOfflineAddresses: 'Sin conexión. Las sugerencias de direcciones no están disponibles; las paradas y líneas siguen funcionando.'
  ,searchRetry: 'Reintentar'
  ,useAsOrigin: 'Usar como origen'
  ,useAsDestination: 'Usar como destino'
  ,useAddressAsOrigin: 'Origen'
  ,useAddressAsDestination: 'Destino'
} as const;
