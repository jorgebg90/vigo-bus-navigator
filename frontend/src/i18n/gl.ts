import { messages as spanish } from './es';

export const messages = {
	...spanish,
	appTitle: 'Vigo Bus Navigator',
	searchLines: 'Buscar liñas',
	busLines: 'Liñas de autobús',
	language: 'Lingua',
	favorites: 'Favoritos',
	recentViews: 'Vistas recentes',
	storageUnavailable: 'Almacenamento non dispoñible: os cambios perderanse ao recargar.',
	dayType: 'Tipo de día',
	weekday: 'Día laborable',
	saturday: 'Sábado',
	sundayHoliday: 'Domingo / festivo',
	dataset: 'Datos {version}',
	noService: 'Non hai servizo para este tipo de día.',
	frequencyUnavailable: 'Non hai datos de frecuencia publicados para esta liña.',
	viewService: 'Ver servizo de {dayType}',
	addFavorite: 'Engadir ou quitar favorito',
	timeBand: 'Franxa horaria',
	first: 'Primeira',
	last: 'Última',
	interval: 'Intervalo',
	stop: 'Parada {id}',
	stops: 'Paradas',
	mapLabel: 'Mapa interactivo de paradas',
	mapStops: 'Paradas do mapa',
	stopDetails: '{name} ({code}) - liñas: {lines} - {lat}, {lon}',
	mapUnavailable: 'Mapa non dispoñible. Amósase a lista accesible de paradas.',
	mapDataAnomaly: '{count} parada(s) sen ubicación válida en Vigo non se amosan no mapa.',
	offline: 'Sen conexión: móstranse datos gardados.',
	live: 'Tempo real',
	cached: 'Datos gardados',
	unavailable: 'Chegadas non dispoñibles',
	statusCurrent: 'Tempo real',
	syntheticData: 'Datos de mostra sintéticos',
	lineDepartures: 'Saídas',
	lineScheduleTitle: 'Saídas e chegadas',
	scheduleSource: 'Horario · {source} · recibido {time}',
	provisionalScheduleSource: 'Avaliación provisional de mostra · {source} · recibida {time}',
	sourceLabel: 'Fonte: {source}',
	provisionalSourceLabel: 'Orixe provisional de mostra: {source}',
	routeShapeTextAlternative: 'Este trazado é unha vista provisional; non hai unha descrición verificada parada a parada dispoñible.',
	provisionalDataWarning: 'Datos provisionais: inferidos e non verificados polo provedor.',
	routeShapePreview: 'Vista provisional do trazado',
	routeShape: 'Trazado do percorrido',
	routeShapeStopsAlternative: 'As listas de paradas de cada sentido describen este trazado.',
	lineMapDefaultDirection: 'Percorrido',
	lineMapUnavailable: 'Non hai un percorrido verificado dispoñible para esta liña.',
	loadingLineMapRoute: 'Cargando o percorrido…',
	tripStopSequence: 'Paradas provisionais da viaxe, en orde',
	lineStopDepartures: 'Saídas provisionais da liña {line}',
	statusStale: 'Datos desactualizados',
	statusEmpty: 'Sen chegadas próximas',
	statusUnavailable: 'Chegadas non dispoñibles',
	statusLoading: 'Cargando chegadas…',
	retry: 'Reintentar',
	updated: 'Actualizado: {time}',
	refreshArrivals: 'Actualizar chegadas',
	arrivalsTo: '{line} cara a {destination}: {minutes} min',
	navMap: 'Mapa',
	navSearch: 'Buscar',
	navJourneys: 'Planificar viaxe',
	navLines: 'Liñas',
	navSaved: 'Gardado',
	about: 'Acerca de',
	noMapPosition: 'Sen posición no mapa',
	close: 'Pechar',
	expand: 'Ampliar',
	collapse: 'Contraer',
	stopSearch: 'Buscar paradas',
	clearSearch: 'Limpar busca',
	noStopsFound: 'Non hai paradas que coincidan con «{query}»',
	savedFavorites: 'Favoritos',
	savedRecent: 'Recentes',
	removeFavorite: 'Quitar dos favoritos',
	stopPanelTitle: 'Parada {name}',
	linePanelTitle: 'Liña {line}',
	zoomIn: 'Achegar',
	zoomOut: 'Afastar',
	recenter: 'Centrar mapa',
	loadingStops: 'Cargando paradas',
	catalogError: 'Non se puideron cargar as paradas',
	statusOffline: 'Sen conexión',
	liveUnavailable: 'As chegadas non están dispoñibles para esta parada',
	servingLines: 'Liñas que paran aquí',
	lineFrequencies: 'Ver frecuencias das liñas',
	openLineRoute: 'Ver percorrido da liña {line}',
	mapRetry: 'Reintentar mapa',
	useSearch: 'Usar busca',
	mapControls: 'Controis do mapa',
	stopsHere: 'Paradas aquí ({count})',
	loadingLineRoute: 'Cargando o percorrido da liña…'
	,saveFavorite: 'Gardar {name} nos favoritos'
	,removeFavoriteNamed: 'Quitar {name} dos favoritos'
	,savedEmpty: 'Aínda non hai favoritos'
	,recentEmpty: 'Non hai elementos recentes'
	,openFavorite: 'Abrir {name}'
	,remove: 'Quitar'
	,unavailableFavorite: 'Non dispoñible: {name}'
	,favoritesCannotSave: 'Non se poden gardar favoritos neste dispositivo'
	,journeySearchTitle: 'Planifica a túa viaxe'
	,journeyModeBus: 'Autobús'
	,journeyRouteSearch: 'Buscar autobuses'
	,journeyOrigin: 'Orixe'
	,journeyDestination: 'Destino'
	,journeySwapEndpoints: 'Intercambiar orixe e destino'
	,journeyClearOrigin: 'Borrar orixe'
	,journeyClearDestination: 'Borrar destino'
	,journeyOriginPlaceholder: 'Buscar unha rúa ou lugar en Vigo'
	,journeyDestinationPlaceholder: 'Buscar destino en Vigo'
	,journeyAddressSearching: 'Buscando enderezos…'
	,journeyAddressNoResults: 'Non se atoparon enderezos en Vigo.'
	,journeyAddressUnavailable: 'Non se puido buscar o enderezo. Comproba a conexión e téntao de novo.'
	,journeyCurrentLocationLabel: 'A miña localización actual'
	,journeyGeocoderAttribution: 'Xeocodificación: planificador de Vigo'
	,journeyPrivacySummary: 'Privacidade'
	,journeyNearbyStops: 'Paradas próximas'
	,journeyNoNearbyStops: 'Non hai paradas de autobús a 500 m ou menos.'
	,journeyNoStopsInCatalog: 'O catálogo de paradas dispoñible non contén paradas a 500 m ou menos.'
	,journeyInvalidSearch: 'Escolle dous puntos válidos distintos e unha hora de saída válida en Vigo.'
	,journeyPointOutside: 'A localización queda fóra da cobertura do autobús de Vigo.'
	,journeyPrivacyNote: 'O texto dos enderezos envíase ao autocompletado municipal de Vigo para buscar suxestións. Ao buscar unha viaxe, as coordenadas de orixe e destino e a data e hora envíanse ao planificador municipal de Vigo. A app non garda estas buscas nin as rexistra como historial.'
	,journeyDataIncomplete: 'Os horarios dispoñibles non permiten calcular unha viaxe completa de forma fiable.'
	,journeyDataUnavailable: 'Non se puideron consultar os datos necesarios. Conservamos os puntos para reintentar.'
	,journeyNoResults: 'O planificador non devolveu opcións que cumpran esta busca. Proba outra hora ou destino.'
	,journeyResults: 'Opcións de viaxe'
	,journeyDirectResult: 'Viaxe directa na liña {line}'
	,journeyEstimatedDuration: 'Duración estimada: {minutes} min'
	,journeyApproxDistance: 'aprox. {meters} m'
	,journeyApproxWalk: 'a pé aprox. {minutes} min'
	,journeyUseCurrentLocation: 'Usar a miña localización'
	,journeyLocationUnavailable: 'Non se puido obter a localización. Podes escribir un enderezo como orixe.'
	,journeyDepartureTime: 'Data e hora de saída (hora de Vigo) '
	,journeySort: 'Ordenar por '
	,journeySortArrival: 'Chegada máis temperá'
	,journeySortTransfers: 'Menos transbordos'
	,journeySortWalking: 'Menos camiñada'
	,journeyOptionTitle: 'Saída {departure} · chegada {arrival}'
	,journeyLegs: 'Tramos en autobús'
	,journeyLegDescription: 'Liña {line}: {origin} a {destination}, {departure}–{arrival}'
	,journeyOptionSummary: '{duration} min · {transfers} transbordos · camiñada aprox. {walking} min · espera {wait} min · acceso aprox. {access} m · saída aprox. {egress} m'
	,journeyLiveWait: 'Espera inicial axustada cunha chegada recente; conta atrás e duración aproximadas.'
	,journeyLiveWaitDetails: 'Espera inicial segundo chegada recibida hai {age} s; incerteza da conta atrás: ±{uncertainty} min.'
	,journeyScheduleWait: 'Espera estimada segundo un horario verificado.'
  ,journeyLoading: 'Calculando rutas…'
  ,journeyBusLine: 'Bus {line}'
  ,journeyWalkShort: 'A pé'
  ,journeyWalkTo: 'Camiña ata {destination}'
  ,journeyTransitSummary: '{minutes} min · {transfers} transbordos · {walking} min a pé'
  ,journeyIntermediateStops: '{count} paradas intermedias'
  ,journeyWalkingDirections: 'Indicacións a pé'
  ,journeyWalkSidewalk: 'Camiña pola beirarrúa'
  ,journeyWalkPath: 'Segue o camiño peonil'
  ,journeyWalkStairs: 'Continúa polas escaleiras'
  ,journeyWalkContinue: 'Continúa a pé'
  ,journeyWalkStreet: 'Camiña por {street}'
  ,journeyStepDistance: 'Durante {meters} m'
  ,journeyOtpScheduled: 'Horario previsto · Planificador municipal de Vigo'
  ,journeyOtpRealtime: 'Estimación en tempo real · Planificador municipal de Vigo'
  ,journeyMoreOptions: 'Ver máis opcións'
  ,journeyWait: 'Espera: {minutes} min'
	,firstDeparture: 'Primeira saída'
	,lastDeparture: 'Última saída'
	,frequencyCaption: 'Frecuencias de {line} · {dayType}'
	,	noPublishedService: 'Non hai servizo publicado para este tipo de día',
	servingLinesTitle: 'Liñas',
	bundledScheduleSnapshotSource: 'Horario sen conexión empaquetado · {source} · data de {dateKind} {date} · {line} / {direction} · {dayType}',
	snapshotScheduleUnavailable: 'Non hai un horario empaquetado fiable para esta liña, dirección e tipo de día.',
	publicationDate: 'publicación',
	effectiveDate: 'vixencia',
	captureDate: 'captura'
  ,locationNoNearbyStops: 'Non se amosan paradas de autobús próximas.'
  ,locationUnavailable: 'Non se puido utilizar a túa ubicación.'
  ,locationOutsideCoverage: 'A túa ubicación está fóra da cobertura de Vigo.'
} as const;
