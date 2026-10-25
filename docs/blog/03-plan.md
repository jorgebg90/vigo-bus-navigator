# Building Vigo Bus Navigator: Plan

The implementation plan separates the frontend and the Cloudflare Worker. Domain rules remain pure, application services depend on explicit ports, and infrastructure adapters provide schedules, arrivals, storage, maps, and visibility.

The plan also makes performance measurable: the initial JavaScript and CSS budget is 500 KB gzipped, with a 150 KB shell and a 350 KB lazy map chunk. MapLibre GL JS and deck.gl are isolated behind `MapPort`, while Workbox precaches the shell and schedule snapshot for repeat offline visits.
