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
  stopsInView: 'Paradas en el mapa',
  zoomIn: 'Acercar',
  zoomOut: 'Alejar',
  recenter: 'Centrar mapa',
  loadingStops: 'Cargando paradas',
  catalogError: 'No se pudieron cargar las paradas'
  ,statusOffline: 'Sin conexión'
  ,liveUnavailable: 'Las llegadas no están disponibles para esta parada'
  ,servingLines: 'Líneas que paran aquí'
  ,lineFrequencies: 'Ver frecuencias de las líneas'
  ,mapRetry: 'Reintentar mapa'
  ,useSearch: 'Usar búsqueda',
  mapControls: 'Controles del mapa',
  stopsHere: 'Paradas aquí ({count})'
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
  ,scheduleSource: 'Horario · {source} · recibido {time}'
  ,provisionalScheduleSource: 'Evaluación provisional de muestra · {source} · recibida {time}'
  ,sourceLabel: 'Fuente: {source}'
  ,provisionalSourceLabel: 'Origen provisional de muestra: {source}'
  ,routeShapeTextAlternative: 'Este trazado es una vista provisional; no hay una descripción verificada parada por parada disponible.'
  ,provisionalDataWarning: 'Datos provisionales: inferidos y no verificados por el proveedor.'
  ,routeShapePreview: 'Vista provisional del trazado'
  ,routeShape: 'Trazado del recorrido'
  ,routeShapeStopsAlternative: 'Las listas de paradas de cada sentido describen este trazado.'
  ,lineMapDirections: 'Sentidos mostrados en el mapa'
  ,lineMapDirection: 'Sentido: {direction}'
  ,lineMapDefaultDirection: 'Recorrido'
  ,lineMapUnavailable: 'No hay un recorrido verificado disponible para esta línea.'
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
} as const;
