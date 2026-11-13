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
	syntheticData: 'Synthetic sample data',
	statusStale: 'Stale data',
	statusEmpty: 'No upcoming arrivals',
	statusUnavailable: 'Arrivals unavailable',
	statusLoading: 'Loading arrivals…',
	retry: 'Retry',
	updated: 'Updated: {time}',
	refreshArrivals: 'Refresh arrivals',
	arrivalsTo: '{line} to {destination}: {minutes} min',
	navMap: 'Map',
	navSearch: 'Search',
	navJourneys: 'Plan a trip',
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
	zoomIn: 'Zoom in',
	zoomOut: 'Zoom out',
	recenter: 'Recenter map',
	loadingStops: 'Loading stops',
	catalogError: 'Could not load stops',
	statusOffline: 'Offline',
	liveUnavailable: 'Live arrivals are unavailable for this stop',
	servingLines: 'Lines serving this stop',
	lineFrequencies: 'View line frequencies',
	openLineRoute: 'Open route for line {line}',
	mapRetry: 'Retry map',
	useSearch: 'Use search',
	mapControls: 'Map controls',
	stopsHere: 'Stops here ({count})',
	loadingLineRoute: 'Loading line route…'
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
	,lineCatalogUnavailable: 'The municipal line catalog is unavailable right now.'
	,scheduleMappingUnavailable: 'The timetable is unavailable because the line-to-schedule mapping has not been verified.'
	,lineDepartures: 'Departures'
	,lineScheduleTitle: 'Departures and arrivals'
	,scheduleSource: 'Schedule · {source} · received {time}'
	,provisionalScheduleSource: 'Provisional fixture evaluation · {source} · received {time}'
	,sourceLabel: 'Source: {source}'
	,provisionalSourceLabel: 'Provisional fixture source: {source}'
	,routeShapeTextAlternative: 'This shape is a provisional preview; no verified stop-by-stop description is available.'
	,provisionalDataWarning: 'Provisional data — inferred and not verified by the provider.'
	,routeShapePreview: 'Provisional route shape preview'
	,routeShape: 'Route shape'
	,routeShapeStopsAlternative: 'The stop lists for each direction describe this shape.'
	,lineMapDefaultDirection: 'Route'
	,lineMapUnavailable: 'No verified route is available for this line.'
	,loadingLineMapRoute: 'Loading route…'
	,tripStopSequence: 'Provisional ordered trip stops'
	,lineStopDepartures: 'Provisional departures for line {line}'
	,bundledDiscoveryNotice: 'General stop search and route-pattern summaries still use the bundled discovery catalog captured on {date}; it may not be exhaustive.'
	,servingLinesTitle: 'Lines'
	,servingLinesLoading: 'Loading lines for this stop…'
	,servingLinesUnavailable: 'The lines serving this stop could not be verified.'
	,bundledScheduleSnapshotSource: 'Bundled offline timetable · {source} · {dateKind} date {date} · {line} / {direction} · {dayType}'
	,snapshotScheduleUnavailable: 'No trustworthy bundled timetable is available for this line, direction, and day.'
	,publicationDate: 'publication'
	,effectiveDate: 'effective'
	,captureDate: 'capture'
	,journeySearchTitle: 'Plan your trip'
	,journeyModeBus: 'Bus'
	,journeyRouteSearch: 'Find buses'
	,journeyOrigin: 'Origin'
	,journeyDestination: 'Destination'
	,journeySwapEndpoints: 'Swap origin and destination'
	,journeyClearOrigin: 'Clear origin'
	,journeyClearDestination: 'Clear destination'
	,journeyOriginPlaceholder: 'Search for a street or place in Vigo'
	,journeyDestinationPlaceholder: 'Search for a destination in Vigo'
	,journeyAddressSearching: 'Searching addresses…'
	,journeyAddressNoResults: 'No addresses found in Vigo.'
	,journeyAddressUnavailable: 'Address search is unavailable. Check your connection and try again.'
	,journeyCurrentLocationLabel: 'My current location'
	,journeyGeocoderAttribution: 'Geocoding: Vigo planner'
	,journeyPrivacySummary: 'Privacy'
	,journeyNearbyStops: 'Nearby stops'
	,journeyNoNearbyStops: 'No bus stops are within 500 m.'
	,journeyNoStopsInCatalog: 'No stops in the available stop catalog are within 500 m.'
	,journeyInvalidSearch: 'Choose two different valid points and a valid Vigo departure time.'
	,journeyPointOutside: 'That location is outside Vigo bus coverage.'
	,journeyPrivacyNote: 'Address text is sent to Vigo municipal autocomplete for suggestions. When you search for a trip, origin and destination coordinates and the departure date/time are sent to the Vigo municipal planner. The app does not save these searches or record them as history.'
	,journeyDataIncomplete: 'Available timetables are not sufficient to reliably calculate a complete journey.'
	,journeyDataUnavailable: 'Required data could not be loaded. Your selected points are kept for retry.'
	,journeyNoResults: 'The planner returned no options matching this search. Try another time or destination.'
	,journeyResults: 'Journey options'
	,journeyDirectResult: 'Direct journey on line {line}'
	,journeyEstimatedDuration: 'Estimated duration: {minutes} min'
	,journeyApproxDistance: 'about {meters} m'
	,journeyApproxWalk: 'about {minutes} min walking'
	,journeyUseCurrentLocation: 'Use my location'
	,journeyLocationUnavailable: 'Could not get your location. You can type an origin address instead.'
	,journeyDepartureTime: 'Departure date and time (Vigo time) '
	,journeySort: 'Sort by '
	,journeySortArrival: 'Earliest arrival'
	,journeySortTransfers: 'Fewest transfers'
	,journeySortWalking: 'Least walking'
	,journeyOptionTitle: 'Depart {departure} · arrive {arrival}'
	,journeyLegs: 'Bus legs'
	,journeyLegDescription: 'Line {line}: {origin} to {destination}, {departure}–{arrival}'
	,journeyOptionSummary: '{duration} min · {transfers} transfers · about {walking} min walking · {wait} min waiting · about {access} m access · about {egress} m egress'
	,journeyLiveWait: 'Initial wait adjusted with a recent arrival; countdown and duration are approximate.'
	,journeyLiveWaitDetails: 'Initial wait from arrival received {age} s ago; countdown uncertainty: ±{uncertainty} min.'
	,journeyScheduleWait: 'Schedule-based wait estimate from a verified timetable.'
  ,journeyLoading: 'Calculating routes…'
  ,journeyBusLine: 'Bus {line}'
  ,journeyWalkShort: 'Walk'
  ,journeyWalkTo: 'Walk to {destination}'
  ,journeyTransitSummary: '{minutes} min · {transfers} transfers · {walking} min walking'
  ,journeyIntermediateStops: '{count} intermediate stops'
  ,journeyWalkingDirections: 'Walking directions'
  ,journeyWalkSidewalk: 'Walk along the sidewalk'
  ,journeyWalkPath: 'Follow the footpath'
  ,journeyWalkStairs: 'Continue along the stairs'
  ,journeyWalkContinue: 'Continue walking'
  ,journeyWalkStreet: 'Walk along {street}'
  ,journeyStepDistance: 'For {meters} m'
  ,journeyOtpScheduled: 'Scheduled · Vigo municipal planner'
  ,journeyOtpRealtime: 'Realtime estimate · Vigo municipal planner'
  ,journeyMoreOptions: 'Show more options'
  ,journeyWait: 'Wait: {minutes} min'
  ,locationNoNearbyStops: 'No nearby bus stops are shown.'
  ,locationUnavailable: 'Your location could not be used.'
  ,locationOutsideCoverage: 'Your location is outside Vigo bus coverage.'
} as const;
