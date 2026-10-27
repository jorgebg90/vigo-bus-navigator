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
	statusStale: 'Datos desactualizados',
	statusEmpty: 'Sen chegadas próximas',
	statusUnavailable: 'Chegadas non dispoñibles',
	statusLoading: 'Cargando chegadas…',
	retry: 'Reintentar',
	updated: 'Actualizado {time}',
	arrivalsTo: '{line} cara a {destination}: {minutes} min',
	navMap: 'Mapa',
	navSearch: 'Buscar',
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
	stopsInView: 'Paradas no mapa',
	zoomIn: 'Achegar',
	zoomOut: 'Afastar',
	recenter: 'Centrar mapa',
	loadingStops: 'Cargando paradas',
	catalogError: 'Non se puideron cargar as paradas',
	statusOffline: 'Sen conexión',
	liveUnavailable: 'As chegadas non están dispoñibles para esta parada',
	servingLines: 'Liñas que paran aquí',
	lineFrequencies: 'Ver frecuencias das liñas',
	mapRetry: 'Reintentar mapa',
	useSearch: 'Usar busca',
	mapControls: 'Controis do mapa',
	stopsHere: 'Paradas aquí ({count})'
	,saveFavorite: 'Gardar {name} nos favoritos'
	,removeFavoriteNamed: 'Quitar {name} dos favoritos'
	,savedEmpty: 'Aínda non hai favoritos'
	,recentEmpty: 'Non hai elementos recentes'
	,openFavorite: 'Abrir {name}'
	,remove: 'Quitar'
	,unavailableFavorite: 'Non dispoñible: {name}'
	,favoritesCannotSave: 'Non se poden gardar favoritos neste dispositivo'
	,firstDeparture: 'Primeira saída'
	,lastDeparture: 'Última saída'
	,frequencyCaption: 'Frecuencias de {line} · {dayType}'
	,noPublishedService: 'Non hai servizo publicado para este tipo de día'
} as const;
