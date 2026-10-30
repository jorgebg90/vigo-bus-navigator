# Data Model: Improve Mobile Map Usability

**Date**: 2026-10-29
**Feature**: [spec.md](./spec.md)

This feature introduces no persisted or domain data. The following are
transient presentation states derived from existing line and location
operations.

## Line Selection Presentation

Represents what the line-browsing area shows for the current selection.

| Field | Type | Description |
| --- | --- | --- |
| `state` | `list \| loading \| details \| unavailable` | Current visible line-selection state. |
| `lineId` | Existing line identifier or absent | The line associated with the pending or displayed view. |
| `routeState` | `pending \| available \| unavailable \| not-applicable` | Route outcome while line details are visible. |
| `requestVersion` | Existing request version | Identifies the current selection so late work cannot replace a newer selection or a closed view. |

### State transitions

```text
list --select line--> loading
loading --line data available--> details (route pending or available)
loading --line data unavailable--> unavailable
details --route available--> details (route available)
details --route unavailable--> details (route unavailable)
loading/details/unavailable --close--> list/map
loading/details/unavailable --select another line--> loading (new request version)
```

Closing or changing the destination invalidates the prior request version.
An outcome associated with an obsolete version is ignored.

## Map Presentation

| Field | Type | Description |
| --- | --- | --- |
| `destination` | Existing destination state | Whether the application is showing the map or line browsing. |
| `lineDetailsOpen` | Boolean presentation state | Whether selected-line content occupies the mobile lower region. |
| `mapViewport` | `full \| reduced` | Full map when line details are closed; reduced map while the line-browsing view occupies screen space. |

The map itself remains mounted. Closing line details returns the destination
to the map and restores the full available map viewport.

## Location Message Presentation

Uses the existing location outcomes; it does not change location acquisition.

| Existing outcome | Location usable? | Mobile presentation | Non-mobile presentation |
| --- | --- | --- | --- |
| `unavailable` | No | Suppressed | Existing message |
| `outside-coverage` | No | Suppressed | Existing message |
| `no-nearby-stops` | Yes | Existing informative message | Existing informative message |
| no status | Not applicable | No message | No message |

Message suppression affects presentation only. It does not retry, alter, store,
or transmit a location.

## Validation Rules

- Pending feedback is associated with exactly one current line selection.
- Data from a superseded or closed selection cannot become visible.
- Every loading state has a terminal outcome: line details, unavailable line
  data, or route unavailable.
- A close action restores the map destination regardless of the line detail
  state.
- A location-failure message is absent on mobile; a no-nearby-stops message is
  retained only when location was successfully applied.
