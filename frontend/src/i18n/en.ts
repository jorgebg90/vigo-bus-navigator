import { messages as spanish } from './es';

export const messages = {
	...spanish,
	appTitle: 'Vigo Bus Navigator',
	searchLines: 'Search lines',
	busLines: 'Bus lines',
	language: 'Language',
	favorites: 'Favorites',
	recentViews: 'Recent views',
	storageUnavailable: 'Storage unavailable: changes will be lost after reload.',
	dayType: 'Day type',
	weekday: 'Weekday',
	saturday: 'Saturday',
	sundayHoliday: 'Sunday / holiday',
	dataset: 'Data {version}',
	noService: 'No service on this day type.',
	frequencyUnavailable: 'No published frequency data is available for this line.',
	viewService: 'View {dayType} service',
	addFavorite: 'Add or remove favorite',
	timeBand: 'Time band',
	first: 'First',
	last: 'Last',
	interval: 'Interval',
	stop: 'Stop {id}',
	stops: 'Stops',
	mapLabel: 'Interactive bus stop map',
	mapStops: 'Map stops',
	stopDetails: '{name} ({code}) - lines: {lines} - {lat}, {lon}',
	mapUnavailable: 'Map unavailable. Showing accessible stop list.',
	mapDataAnomaly: '{count} stop(s) without a valid Vigo location are hidden from the map.',
	offline: 'Offline: showing saved schedule data.',
	live: 'Live',
	cached: 'Cached data',
	unavailable: 'Arrivals unavailable',
	statusCurrent: 'Live',
	statusStale: 'Stale data',
	statusEmpty: 'No upcoming arrivals',
	statusUnavailable: 'Arrivals unavailable',
	statusLoading: 'Loading arrivals…',
	retry: 'Retry',
	updated: 'Updated {time}',
	arrivalsTo: '{line} to {destination}: {minutes} min',
	navMap: 'Map',
	navSearch: 'Search',
	navLines: 'Lines',
	navSaved: 'Saved',
	about: 'About',
	noMapPosition: 'No map position',
	close: 'Close',
	expand: 'Expand',
	collapse: 'Collapse',
	stopSearch: 'Search stops',
	clearSearch: 'Clear search',
	noStopsFound: 'No stops match “{query}”',
	savedFavorites: 'Favorites',
	savedRecent: 'Recent',
	removeFavorite: 'Remove from favorites',
	stopPanelTitle: 'Stop {name}',
	linePanelTitle: 'Line {line}',
	stopsInView: 'Stops in view',
	zoomIn: 'Zoom in',
	zoomOut: 'Zoom out',
	recenter: 'Recenter map',
	loadingStops: 'Loading stops',
	catalogError: 'Could not load stops',
	statusOffline: 'Offline',
	liveUnavailable: 'Live arrivals are unavailable for this stop',
	servingLines: 'Lines serving this stop',
	lineFrequencies: 'View line frequencies',
	mapRetry: 'Retry map',
	useSearch: 'Use search',
	mapControls: 'Map controls',
	stopsHere: 'Stops here ({count})'
	,saveFavorite: 'Save {name} to favorites'
	,removeFavoriteNamed: 'Remove {name} from favorites'
	,savedEmpty: 'No favorites saved yet'
	,recentEmpty: 'No recent items'
	,openFavorite: 'Open {name}'
	,remove: 'Remove'
	,unavailableFavorite: 'Unavailable: {name}'
	,favoritesCannotSave: 'Favorites cannot be saved on this device'
	,firstDeparture: 'First departure'
	,lastDeparture: 'Last departure'
	,frequencyCaption: '{line} frequency · {dayType}'
	,noPublishedService: 'No published service for this day type'
} as const;
