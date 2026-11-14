# In-App Contract: Menu and Search

This document defines an in-process user-interface contract. It does not expose a server API or introduce an external service.

## Primary Navigation

- The five existing destinations remain available: map, search, journey planning, lines, and saved items.
- On phone-sized layouts, primary navigation is a labeled bottom bar; on tablet and desktop layouts it is a persistent labeled rail.
- The active destination is visually distinct and exposed through `aria-current="page"`.
- Every destination has an accessible name independent of its icon. The language/settings control remains reachable outside primary navigation.
- Navigation does not cover map controls, panel actions, or essential content. It remains reachable without horizontal scrolling at the supported 320 CSS pixel minimum viewport.
- Selecting a destination updates its heading and document title and follows existing focus management and browser back behavior.

## Unified Search

- The same search entry point is available from every primary destination.
- The search surface can present stop and line matches from the existing discovery catalogs and address suggestions from the existing approved address-search port.
- Results identify whether they are stops, lines, or addresses and only show actions supported by the selected result.
- Blank input produces no address request. Address autocomplete uses its existing fixed host, parameters, cancellation, and privacy disclosure; queries and address results are not logged, cached, placed in the URL, or persisted.
- Search provides explicit loading, no-results, unavailable/error, and offline feedback. A retry is offered only when the operation can be repeated.
- Changing the query or leaving search invalidates stale suggestions; results from an older query must not replace the current result set.

## Cross-Destination Actions

- Selecting a stop opens existing stop/map details. Where valid coordinates exist, the rider can use the stop as journey origin or destination, view it on the map, or favorite it.
- Selecting a line opens existing line details. The rider can favorite the line, view its route, and continue into trip planning through an explicitly selected route stop.
- Selecting an address fills the chosen journey endpoint and opens the journey planner. It does not start route planning until the rider explicitly submits the journey form.
- Handoffs retain relevant context in memory and provide a predictable return path. They do not create new local-storage or URL state.
- If an item lacks the required identifier, coordinates, or associated action, the unsupported action is absent or clearly unavailable; the app must not fabricate a fallback target.

## Panels, Feedback, and Accessibility

- Existing detail panels and sheets retain their close, Escape, focus-return, and responsive behavior.
- Sections and panels use consistent headings, content grouping, selected states, and status/empty/error patterns.
- All controls work by keyboard and touch, expose names and state to assistive technology, and meet WCAG 2.2 AA and 44 CSS pixel target requirements.
- Reduced-motion preferences are respected. New or changed copy is present in English, Spanish, and Galician.
- Loading and backgrounded real-time requests continue to obey existing cancellation, visibility, offline, and freshness behavior.
