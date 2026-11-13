export const openApiContracts = [
  {
    path: 'specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml',
    page: 'index.html',
    title: 'Municipal transit API contract'
  },
  {
    path: 'specs/011-bus-itinerary-search/contracts/address-geocoding.openapi.yaml',
    page: 'autocomplete.html',
    title: 'Municipal address autocomplete'
  },
  {
    path: 'specs/011-bus-itinerary-search/contracts/route-planning.openapi.yaml',
    page: 'route-planning.html',
    title: 'Municipal journey planning'
  },
  {
    path: 'specs/011-bus-itinerary-search/contracts/map-resources.openapi.yaml',
    page: 'map-resources.html',
    title: 'External basemap resources'
  }
] as const;
